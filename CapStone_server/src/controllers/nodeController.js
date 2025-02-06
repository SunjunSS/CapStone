const nodeService = require("../services/nodeService/nodeService");

// 🟢 노드 추가 API
exports.addNodes = async (req, res) => {
  try {
    const response = await nodeService.addNodes(req.body.addedNodes);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔴 노드 삭제 API
exports.deleteNodes = async (req, res) => {
  try {
    const response = await nodeService.deleteNodes(req.body.deletedNodes);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🟡 노드 수정 API
exports.updateNode = async (req, res) => {
  try {
    const response = await nodeService.updateNode(req.body.updatedNode);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🟢 마인드맵 조회 API
exports.getMindmap = async (req, res) => {
  try {
    const response = await nodeService.getMindmap();
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
