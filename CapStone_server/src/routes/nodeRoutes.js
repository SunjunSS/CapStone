const express = require("express");
const nodeController = require("../controllers/nodeController");

const router = express.Router();

// REST API 라우트 등록
router.post("/save", nodeController.addNodes);
router.delete("/delete", nodeController.deleteNodes);
router.patch("/update", nodeController.updateNode);
router.get("/", nodeController.getMindmap);

module.exports = router;
