// routes/bestIdeaRoutes.js
const express = require("express");
const router = express.Router();
const bestIdeaController = require("../controllers/bestIdeaController");

// 베스트 아이디어 라우트

// 모든 베스트 아이디어 조회
router.get("/", bestIdeaController.getAllBestIdeas);

// 특정 ID의 베스트 아이디어 조회
router.get("/:id", bestIdeaController.getBestIdeaById);

// 특정 프로젝트의 베스트 아이디어 조회
router.get("/project/:projectId", bestIdeaController.getBestIdeasByProjectId);

// 베스트 아이디어 생성
router.post("/", bestIdeaController.createBestIdea);
router.post(
  "/project/:projectId/generate",
  bestIdeaController.generateAndSaveBestIdeas
);

// 베스트 아이디어 수정
router.put("/:id", bestIdeaController.updateBestIdea);

// 베스트 아이디어 삭제
router.delete("/:id", bestIdeaController.deleteBestIdea);

// 프로젝트의 모든 베스트 아이디어 삭제
router.delete(
  "/project/:projectId",
  bestIdeaController.deleteBestIdeasByProjectId
);

module.exports = router;
