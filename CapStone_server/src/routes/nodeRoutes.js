const express = require("express");

module.exports = (io) => {
  const nodeController = require("../controllers/nodeController")(io);
  const router = express.Router();

  router.post("/:project_id", nodeController.addNodes);
  router.delete("/:project_id/:key", nodeController.deleteNode); // ✅ key 추가
  router.patch("/:project_id/:key", nodeController.updateNode); // ✅ key 추가
  router.get("/:project_id", nodeController.getMindmapByProjectId);

  return router;
};
