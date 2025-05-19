// controllers/bestIdeaController.js
const bestIdeaService = require("../services/bestIdeaService/bestIdeaService");

class BestIdeaController {
  // 모든 베스트 아이디어 조회
  async getAllBestIdeas(req, res) {
    try {
      const bestIdeas = await bestIdeaService.getAllBestIdeas();
      res.status(200).json({
        status: "success",
        data: bestIdeas,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // 특정 ID의 베스트 아이디어 조회
  async getBestIdeaById(req, res) {
    try {
      const { id } = req.params;
      const bestIdea = await bestIdeaService.getBestIdeaById(id);
      res.status(200).json({
        status: "success",
        data: bestIdea,
      });
    } catch (error) {
      res.status(error.message.includes("찾을 수 없습니다") ? 404 : 500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // 특정 프로젝트의 베스트 아이디어 조회
  async getBestIdeasByProjectId(req, res) {
    try {
      const { projectId } = req.params;
      const bestIdeas = await bestIdeaService.getBestIdeasByProjectId(
        projectId
      );
      res.status(200).json({
        status: "success",
        data: bestIdeas,
      });
    } catch (error) {
      res.status(error.message.includes("존재하지 않습니다") ? 404 : 500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // 베스트 아이디어 생성
  async createBestIdea(req, res) {
    try {
      const bestIdea = await bestIdeaService.createBestIdea(req.body);
      res.status(201).json({
        status: "success",
        data: bestIdea,
      });
    } catch (error) {
      res.status(error.message.includes("존재하지 않습니다") ? 404 : 500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // 베스트 아이디어 수정
  async updateBestIdea(req, res) {
    try {
      const { id } = req.params;
      const updatedBestIdea = await bestIdeaService.updateBestIdea(
        id,
        req.body
      );
      res.status(200).json({
        status: "success",
        data: updatedBestIdea,
      });
    } catch (error) {
      const statusCode = error.message.includes("존재하지 않습니다")
        ? 404
        : 500;
      res.status(statusCode).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // 베스트 아이디어 삭제
  async deleteBestIdea(req, res) {
    try {
      const { id } = req.params;
      const result = await bestIdeaService.deleteBestIdea(id);
      res.status(200).json({
        status: "success",
        message: result.message,
      });
    } catch (error) {
      res.status(error.message.includes("존재하지 않습니다") ? 404 : 500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  // 프로젝트의 모든 베스트 아이디어 삭제
  async deleteBestIdeasByProjectId(req, res) {
    try {
      const { projectId } = req.params;
      const result = await bestIdeaService.deleteBestIdeasByProjectId(
        projectId
      );
      res.status(200).json({
        status: "success",
        message: result.message,
      });
    } catch (error) {
      res.status(error.message.includes("존재하지 않습니다") ? 404 : 500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async generateAndSaveBestIdeas(req, res) {
    try {
      const { projectId } = req.params;
      const bestIdeas = await bestIdeaService.generateAndSaveBestIdeas(
        projectId
      );

      res.status(201).json({
        status: "success",
        data: bestIdeas,
      });
    } catch (error) {
      console.error("베스트 아이디어 생성 오류:", error);

      const statusCode =
        error.message.includes("존재하지 않습니다") ||
        error.message.includes("노드가 없습니다")
          ? 404
          : 500;

      res.status(statusCode).json({
        status: "error",
        message: error.message,
      });
    }
  }
}

module.exports = new BestIdeaController();
