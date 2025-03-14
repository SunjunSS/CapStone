const express = require("express");

module.exports = (io) => {
  const nodeController = require("../controllers/nodeController")(io);
  const router = express.Router();

  router.post("/:project_id", nodeController.addNodes);
  router.delete("/:project_id/:key", nodeController.deleteNode); // ✅ key 추가
  router.patch("/:project_id/:key", nodeController.updateNode); // ✅ key 추가
  router.patch("/move/:project_id", nodeController.moveNode);
  router.get("/:project_id", nodeController.getMindmapByProjectId);
  router.post(
    "/:project_id/:key/ai-suggest",
    nodeController.suggestChildNodesFromRoot
  ); // 선택된 노드의 하위 노드 ai 추천 요청 라우터
  router.get("/best-idea/:project_id", nodeController.getBestMindmapIdea);

  return router;
};
