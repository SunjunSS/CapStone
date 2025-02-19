const nodeService = require("../services/nodeService/nodeService");

module.exports = (io) => {
  // 🟢 특정 프로젝트의 노드 추가
  const addNodes = async (req, res) => {
    try {
      const { addedNodes, roomId } = req.body;
      const { project_id } = req.params;

      if (!project_id) {
        return res
          .status(400)
          .json({ success: false, message: "project_id가 필요합니다." });
      }

      if (!roomId) {
        return res
          .status(400)
          .json({ success: false, message: "roomId가 필요합니다." });
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

      if (!project_id || !key) {
        return res.status(400).json({
          success: false,
          message: "project_id와 key 값이 필요합니다.",
        });
      }

      if (!roomId) {
        return res
          .status(400)
          .json({ success: false, message: "roomId가 필요합니다." });
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

      if (!project_id || !key || !name) {
        return res.status(400).json({
          success: false,
          message: "project_id, key, name 값이 필요합니다.",
        });
      }

      if (!roomId) {
        return res
          .status(400)
          .json({ success: false, message: "roomId가 필요합니다." });
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

  return { addNodes, deleteNode, updateNode, getMindmapByProjectId };
};
