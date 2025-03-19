const nodeService = require("../services/nodeService/nodeService");

module.exports = (io) => {
  // 🟢 특정 프로젝트의 노드 추가
  const addNodes = async (req, res) => {
    try {
      const { addedNodes, roomId } = req.body;
      const { project_id } = req.params;

      if (!project_id || !roomId) {
        return res.status(400).json({
          success: false,
          message: "project_id, roomId가 필요합니다.",
        });
      }

      const response = await nodeService.addNodes(addedNodes, project_id);

      if (response.length > 0) {
        console.log("🟢 새 노드 추가됨:", response);
        io.to(roomId).emit("nodeAdded", response);
      }

      res.status(200).json({ success: true, data: response });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // 🔴 특정 프로젝트의 특정 노드 삭제
  const deleteNode = async (req, res) => {
    try {
      const { project_id, key } = req.params;
      const { roomId } = req.body;

      if (!project_id || !key || !roomId) {
        return res.status(400).json({
          success: false,
          message: "project_id와 key, roomId값이 필요합니다.",
        });
      }

      // ✅ 노드 삭제 요청 (자식 노드 포함)
      const deletedKeys = await nodeService.deleteNodeWithChildren(
        key,
        project_id
      );

      if (deletedKeys.length > 0) {
        console.log("🗑️ 삭제된 노드 리스트:", deletedKeys);
        io.to(roomId).emit("nodeDeleted", deletedKeys); // ✅ 삭제된 노드 리스트 전달
      }

      res.status(200).json({ success: true, deletedKeys });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✏️ 특정 프로젝트의 특정 노드 수정
  const updateNode = async (req, res) => {
    try {
      const { project_id, key } = req.params;
      const { name, roomId } = req.body;

      if (!project_id || !key || !name || !roomId) {
        return res.status(400).json({
          success: false,
          message: "project_id, key, name, roomId값이 필요합니다.",
        });
      }

      const response = await nodeService.updateNode(key, project_id, name);

      if (response) {
        console.log("✏️ 노드 수정됨:", response);
        io.to(roomId).emit("nodeUpdated", response);
      }

      res.status(200).json({ success: true, data: response });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ 노드 이동 요청 처리
  const moveNode = async (req, res) => {
    try {
      const { movedNodeId, newParentId, roomId } = req.body;
      const { project_id } = req.params; // ✅ 프로젝트 ID 받아오기

      console.log("📌 [moveNode] API 요청 수신:", {
        movedNodeId,
        newParentId,
        roomId,
        project_id,
      });

      if (!movedNodeId || !newParentId || !project_id) {
        return res.status(400).json({
          success: false,
          message: "이동할 노드 ID, 새 부모 ID, project_id가 필요합니다.",
        });
      }

      // ✅ 부모 노드가 자식 노드로 이동하는지 검증 후 에러 처리
      try {
        const updatedNode = await nodeService.moveNode(
          movedNodeId,
          newParentId,
          project_id
        );

        if (updatedNode) {
          io.to(roomId).emit("nodeMoved", updatedNode);
        }

        res.status(200).json({ success: true, data: updatedNode });
      } catch (error) {
        console.error(
          "🚨 [moveNode] 부모 노드가 자식 노드로 이동할 수 없음:",
          error.message
        );
        return res.status(400).json({ success: false, message: error.message });
      }
    } catch (error) {
      console.error("❌ [moveNode] 노드 이동 중 오류 발생:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ 특정 프로젝트의 마인드맵 조회 (기존 코드 유지)
  const getMindmapByProjectId = async (req, res) => {
    try {
      const { project_id } = req.params;
      if (!project_id) {
        return res
          .status(400)
          .json({ success: false, message: "project_id가 필요합니다." });
      }

      const response = await nodeService.getMindmapByProjectId(project_id);

      if (response.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: "해당 프로젝트의 노드가 없습니다.",
        });
      }

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // 🟢 특정 노드를 클릭하면, 해당 프로젝트의 루트 노드를 기준으로 OpenAI 추천 요청
  const suggestChildNodesFromRoot = async (req, res) => {
    const { project_id, key } = req.params;
    const { roomId } = req.body;

    console.log("📨 AI추천 API 요청 수신:", { project_id, key, roomId });

    if (!project_id || !key) {
      console.warn("🚨 필수값 누락:", { project_id, key });
      return res.status(400).json({
        success: false,
        message: "project_id와 key 값이 필요합니다.",
      });
    }

    try {
      const aiNodes = await nodeService.getSuggestedChildNodes(project_id, key);
      console.log("🤖 추천된 노드들:", aiNodes);

      io.to(roomId).emit("nodeSuggested", { parentNode: key, aiNodes });

      res.status(200).json({ success: true, data: aiNodes });
    } catch (error) {
      console.error("❌ AI 추천 처리 중 오류:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ 프로젝트 내 가장 중요한 노드 및 보완 아이디어 추천 요청
  const getBestMindmapIdea = async (req, res) => {
    try {
      const { project_id } = req.params;
      if (!project_id) {
        return res.status(400).json({
          success: false,
          message: "project_id가 필요합니다.",
        });
      }

      // 🔥 서비스 호출하여 가장 중요한 노드 및 보완 아이디어 가져오기
      const bestIdea = await nodeService.getBestMindmapIdea(project_id);

      console.log("🔍 가장 중요한 노드 AI 분석 결과:", bestIdea);

      res.status(200).json({ success: true, data: bestIdea });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  return {
    addNodes,
    deleteNode,
    updateNode,
    moveNode,
    getMindmapByProjectId,
    suggestChildNodesFromRoot,
    getBestMindmapIdea,
  };
};
