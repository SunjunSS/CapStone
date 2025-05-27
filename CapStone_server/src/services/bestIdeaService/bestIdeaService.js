// services/bestIdeaService.js
const bestIdeaRepository = require("../../repositories/bestIdeaRepository");
const { Project } = require("../../models");
const nodeRepository = require("../../repositories/nodeRepository"); // 노드 리포지토리 import
const { getBestMindmapIdeas } = require("./openAIService");
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

  async generateAndSaveBestIdeas(projectId) {
    try {
      // 문자열로 전달된 project_id를 숫자로 변환
      const numericProjectId = parseInt(projectId, 10);

      if (isNaN(numericProjectId)) {
        throw new Error("유효하지 않은 프로젝트 ID입니다.");
      }

      // 프로젝트가 존재하는지 확인
      const project = await Project.findByPk(numericProjectId);
      if (!project) {
        throw new Error("해당 프로젝트가 존재하지 않습니다.");
      }

      // 1. 프로젝트의 모든 노드 가져오기 (nodeRepository 사용)
      const nodes = await nodeRepository.getAllNodesByProject(numericProjectId);

      if (!nodes || nodes.length === 0) {
        throw new Error("마인드맵에 노드가 없습니다.");
      }

      // 노드 내용(content)만 추출
      const nodeContents = nodes.map((node) => node.content);

      // 2. OpenAI API를 통해 여러 개의 베스트 아이디어 얻기
      const ideasArray = await getBestMindmapIdeas(nodeContents);

      // ideasArray가 배열이 아니거나 비어있으면 오류 처리
      if (!Array.isArray(ideasArray) || ideasArray.length === 0) {
        throw new Error("AI가 베스트 아이디어를 생성하는데 실패했습니다.");
      }

      console.log("AI로부터 받은 아이디어:", ideasArray); // 로깅 추가

      const existingIdeas = await bestIdeaRepository.findByProjectId(
        numericProjectId
      );

      // 새로 추가된 베스트 아이디어만 추적하며 저장
      const newBestIdeas = [];

      for (const idea of ideasArray) {
        const { bestNode } = idea;
        if (!bestNode) {
          continue;
        }

        const isDuplicate = existingIdeas.some(
          (existingIdea) => existingIdea.description === bestNode
        );

        if (!isDuplicate) {
          const bestIdeaData = {
            description: bestNode,
            project_id: numericProjectId,
            original_node: null,
          };

          const createdIdea = await bestIdeaRepository.create(bestIdeaData);
          newBestIdeas.push(createdIdea); // 생성 후 바로 배열에 추가
        }
      }

      console.log(`새로 추가된 아이디어 수: ${newBestIdeas.length}`);
      return newBestIdeas; // 새로 추가된 것만 반환
    } catch (error) {
      console.error("베스트 아이디어 생성 실패:", error);
      throw error;
    }
  }
}

module.exports = new BestIdeaService();
