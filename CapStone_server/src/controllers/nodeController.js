module.exports = (io) => {
  const nodeService = require("../services/nodeService/nodeService");

  const addNodes = async (req, res) => {
    try {
      const { addedNodes, roomId } = req.body;
      if (!roomId) {
        return res
          .status(400)
          .json({ success: false, message: "roomId가 필요합니다." });
      }

      const response = await nodeService.addNodes(addedNodes);

      if (response.length > 0) {
        console.log("🟢 새 노드 추가됨:", response);
        io.to(roomId).emit("nodeAdded", response);
      }

      res.status(200).json({ success: true, deletedNodes: response });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const deleteNodes = async (req, res) => {
    try {
      const { deletedNodes, roomId } = req.body;
      if (!roomId) {
        return res
          .status(400)
          .json({ success: false, message: "roomId가 필요합니다." });
      }

      const response = await nodeService.deleteNodes(deletedNodes);

      if (response.length > 0) {
        console.log("🗑️ 노드 삭제됨:", response);
        io.to(roomId).emit("nodeDeleted", response);
      }

      res.status(200).json({ success: true, deletedNodes: response });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const updateNode = async (req, res) => {
    try {
      const { updatedNode, roomId } = req.body;
      if (!roomId) {
        return res
          .status(400)
          .json({ success: false, message: "roomId가 필요합니다." });
      }

      const response = await nodeService.updateNode(updatedNode);

      if (response) {
        console.log("✏️ 노드 수정됨:", response);
        io.to(roomId).emit("nodeUpdated", response);
      }

      res.status(200).json({ success: true, deletedNodes: response });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ 마인드맵 조회 API (소켓 없음, 클라이언트가 직접 요청해서 가져감)
  const getMindmap = async (req, res) => {
    try {
      const response = await nodeService.getMindmap();
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  return { addNodes, deleteNodes, updateNode, getMindmap };
};
