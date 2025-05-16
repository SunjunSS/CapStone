// services/bestIdeaService.js
const bestIdeaRepository = require("../../repositories/bestIdeaRepository");
const { Project } = require("../../models");

class BestIdeaService {
  // 모든 베스트 아이디어 조회
  async getAllBestIdeas() {
    try {
      return await bestIdeaRepository.findAll();
    } catch (error) {
      throw error;
    }
  }

  // 특정 ID의 베스트 아이디어 조회
  async getBestIdeaById(id) {
    try {
      const bestIdea = await bestIdeaRepository.findById(id);
      if (!bestIdea) {
        throw new Error("해당 ID의 베스트 아이디어를 찾을 수 없습니다.");
      }
      return bestIdea;
    } catch (error) {
      throw error;
    }
  }

  // 특정 프로젝트의 베스트 아이디어 조회
  async getBestIdeasByProjectId(projectId) {
    try {
      // 프로젝트가 존재하는지 확인
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error("해당 프로젝트가 존재하지 않습니다.");
      }

      return await bestIdeaRepository.findByProjectId(projectId);
    } catch (error) {
      throw error;
    }
  }

  // 베스트 아이디어 생성
  async createBestIdea(bestIdeaData) {
    try {
      // 프로젝트가 존재하는지 확인
      const project = await Project.findByPk(bestIdeaData.project_id);
      if (!project) {
        throw new Error("연결하려는 프로젝트가 존재하지 않습니다.");
      }

      return await bestIdeaRepository.create(bestIdeaData);
    } catch (error) {
      throw error;
    }
  }

  // 베스트 아이디어 수정
  async updateBestIdea(id, bestIdeaData) {
    try {
      // 베스트 아이디어가 존재하는지 확인
      const bestIdea = await bestIdeaRepository.findById(id);
      if (!bestIdea) {
        throw new Error("수정하려는 베스트 아이디어가 존재하지 않습니다.");
      }

      // 프로젝트 ID가 변경되는 경우, 해당 프로젝트가 존재하는지 확인
      if (
        bestIdeaData.project_id &&
        bestIdeaData.project_id !== bestIdea.project_id
      ) {
        const project = await Project.findByPk(bestIdeaData.project_id);
        if (!project) {
          throw new Error("연결하려는 프로젝트가 존재하지 않습니다.");
        }
      }

      const updated = await bestIdeaRepository.update(id, bestIdeaData);
      if (updated === 0) {
        throw new Error("베스트 아이디어 업데이트에 실패했습니다.");
      }

      return await bestIdeaRepository.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // 베스트 아이디어 삭제
  async deleteBestIdea(id) {
    try {
      // 베스트 아이디어가 존재하는지 확인
      const bestIdea = await bestIdeaRepository.findById(id);
      if (!bestIdea) {
        throw new Error("삭제하려는 베스트 아이디어가 존재하지 않습니다.");
      }

      const deleted = await bestIdeaRepository.delete(id);
      if (deleted === 0) {
        throw new Error("베스트 아이디어 삭제에 실패했습니다.");
      }

      return { message: "베스트 아이디어가 성공적으로 삭제되었습니다." };
    } catch (error) {
      throw error;
    }
  }

  // 프로젝트의 모든 베스트 아이디어 삭제
  async deleteBestIdeasByProjectId(projectId) {
    try {
      // 프로젝트가 존재하는지 확인
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error("해당 프로젝트가 존재하지 않습니다.");
      }

      const deleted = await bestIdeaRepository.deleteByProjectId(projectId);
      return { message: `${deleted}개의 베스트 아이디어가 삭제되었습니다.` };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BestIdeaService();
