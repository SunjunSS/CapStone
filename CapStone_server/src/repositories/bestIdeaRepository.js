// repositories/bestIdeaRepository.js
const { BestIdea, Project } = require("../models");

class BestIdeaRepository {
  async findOne(conditions) {
    try {
      return await BestIdea.findOne({
        where: conditions,
      });
    } catch (error) {
      throw error;
    }
  }
  // 모든 베스트 아이디어 조회
  async findAll() {
    try {
      return await BestIdea.findAll();
    } catch (error) {
      throw error;
    }
  }

  // 특정 ID의 베스트 아이디어 조회
  async findById(id) {
    try {
      return await BestIdea.findByPk(id);
    } catch (error) {
      throw error;
    }
  }

  // 특정 프로젝트의 베스트 아이디어 조회
  async findByProjectId(projectId) {
    try {
      return await BestIdea.findAll({
        where: { project_id: projectId },
      });
    } catch (error) {
      throw error;
    }
  }

  // 베스트 아이디어 생성
  async create(bestIdeaData) {
    try {
      return await BestIdea.create(bestIdeaData);
    } catch (error) {
      throw error;
    }
  }

  // 베스트 아이디어 수정
  async update(id, bestIdeaData) {
    try {
      const [updated] = await BestIdea.update(bestIdeaData, {
        where: { bi_id: id },
      });
      return updated;
    } catch (error) {
      throw error;
    }
  }

  // 베스트 아이디어 삭제
  async delete(id) {
    try {
      return await BestIdea.destroy({
        where: { bi_id: id },
      });
    } catch (error) {
      throw error;
    }
  }

  // 프로젝트별 베스트 아이디어 삭제
  async deleteByProjectId(projectId) {
    try {
      return await BestIdea.destroy({
        where: { project_id: projectId },
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BestIdeaRepository();
