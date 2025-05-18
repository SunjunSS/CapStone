// src/api/bestIdeaApi.js
import axios from "axios";
import API_BASE_URL from "../config/apiConfig"; // ✅ API URL 설정 파일 가져오기

const API_ENDPOINT = `${API_BASE_URL}/api/best-ideas`;

/**
 * 베스트 아이디어 관련 API 요청을 처리하는 모듈
 */
const bestIdeaApi = {
  /**
   * 모든 베스트 아이디어 조회
   * @returns {Promise} 베스트 아이디어 목록
   */
  getAllBestIdeas() {
    return axios
      .get(API_ENDPOINT)
      .then((response) => response.data.data)
      .catch((error) => {
        console.error("모든 베스트 아이디어 조회 실패:", error);
        throw error;
      });
  },

  /**
   * 특정 ID의 베스트 아이디어 조회
   * @param {string|number} id - 베스트 아이디어 ID
   * @returns {Promise} 베스트 아이디어 정보
   */
  getBestIdeaById(id) {
    return axios
      .get(`${API_ENDPOINT}/${id}`)
      .then((response) => response.data.data)
      .catch((error) => {
        console.error(`ID ${id}의 베스트 아이디어 조회 실패:`, error);
        throw error;
      });
  },

  /**
   * 특정 프로젝트의 베스트 아이디어 조회
   * @param {string|number} projectId - 프로젝트 ID
   * @returns {Promise} 프로젝트에 연결된 베스트 아이디어 목록
   */
  getBestIdeasByProjectId(projectId) {
    return axios
      .get(`${API_ENDPOINT}/project/${projectId}`)
      .then((response) => {
        // 데이터 구조 변환
        return response.data.data.map((idea) => ({
          id: idea.bi_id,
          title: idea.description, // description을 title로 매핑
          project_id: idea.project_id,
          createdAt: idea.createdAt,
        }));
      })
      .catch((error) => {
        console.error(
          `프로젝트 ID ${projectId}의 베스트 아이디어 조회 실패:`,
          error
        );
        throw error;
      });
  },

  /**
   * 새로운 베스트 아이디어 생성
   * @param {Object} bestIdeaData - 생성할 베스트 아이디어 데이터
   * @returns {Promise} 생성된 베스트 아이디어 정보
   */
  createBestIdea(bestIdeaData) {
    return axios
      .post(API_ENDPOINT, bestIdeaData)
      .then((response) => response.data.data)
      .catch((error) => {
        console.error("베스트 아이디어 생성 실패:", error);
        throw error;
      });
  },

  /**
   * 베스트 아이디어 수정
   * @param {string|number} id - 수정할 베스트 아이디어 ID
   * @param {Object} bestIdeaData - 수정할 데이터
   * @returns {Promise} 수정된 베스트 아이디어 정보
   */
  updateBestIdea(id, bestIdeaData) {
    return axios
      .put(`${API_ENDPOINT}/${id}`, bestIdeaData)
      .then((response) => response.data.data)
      .catch((error) => {
        console.error(`ID ${id}의 베스트 아이디어 수정 실패:`, error);
        throw error;
      });
  },

  /**
   * 베스트 아이디어 삭제
   * @param {string|number} id - 삭제할 베스트 아이디어 ID
   * @returns {Promise} 삭제 결과 메시지
   */
  deleteBestIdea(id) {
    return axios
      .delete(`${API_ENDPOINT}/${id}`)
      .then((response) => response.data)
      .catch((error) => {
        console.error(`ID ${id}의 베스트 아이디어 삭제 실패:`, error);
        throw error;
      });
  },

  /**
   * 프로젝트의 모든 베스트 아이디어 삭제
   * @param {string|number} projectId - 베스트 아이디어를 삭제할 프로젝트 ID
   * @returns {Promise} 삭제 결과 메시지
   */
  deleteBestIdeasByProjectId(projectId) {
    return axios
      .delete(`${API_ENDPOINT}/project/${projectId}`)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          `프로젝트 ID ${projectId}의 베스트 아이디어 삭제 실패:`,
          error
        );
        throw error;
      });
  },

  /**
   * AI 추천 주제 목록 가져오기
   * @param {Object} options - 주제 추천 옵션
   * @param {string} [options.category] - 주제 카테고리 (비즈니스, 기술, 교육 등)
   * @param {number} [options.count=20] - 가져올 주제 개수
   * @returns {Promise<Array>} 추천 주제 목록
   */
  getSuggestedTopics(options = {}) {
    const { category, count = 20 } = options;

    let url = `${API_ENDPOINT}/suggest`;
    const params = {};

    if (category) params.category = category;
    if (count) params.count = count;

    return axios
      .get(url, { params })
      .then((response) => response.data.data)
      .catch((error) => {
        console.error("주제 추천 목록 조회 실패:", error);

        // 서버 오류 시 기본 주제 목록 반환 (폴백 옵션)
        return [
          "디지털 트랜스포메이션과 기업의 미래",
          "인공지능이 바꿀 미래 산업 구조",
          "지속가능한 비즈니스 모델 구축 전략",
          "메타버스 플랫폼의 진화와 비즈니스 기회",
          "데이터 기반 의사결정 프로세스 개선 방안",
          "원격 근무 환경에서의 팀 협업 강화 전략",
          "고객 경험(CX) 혁신을 위한 디지털 전략",
          "블록체인 기술의 산업별 적용 사례 연구",
          "디지털 마케팅 트렌드와 효과적인 채널 전략",
          "사이버 보안 위협과 기업의 대응 전략",
          "클라우드 컴퓨팅 도입을 통한 IT 인프라 최적화",
          "빅데이터 분석을 통한 비즈니스 인사이트 도출",
          "자동화와 로봇 공학이 제조업에 미치는 영향",
          "사물인터넷(IoT)의 산업 적용 사례와 가치 창출",
          "스마트 시티 개발과 도시 문제 해결 방안",
          "디지털 헬스케어 트렌드와 의료 산업 혁신",
          "가상현실(VR)과 증강현실(AR)의 교육적 활용",
          "친환경 에너지 기술 개발과 미래 전망",
          "AI 윤리와 책임 있는 기술 개발 원칙",
          "디지털 시대의 리더십과 조직 문화 변화",
        ];
      });
  },

  /**
   * 사용자 정의 카테고리별 주제 목록 가져오기
   * @param {string} category - 주제 카테고리 ID
   * @returns {Promise<Array>} 카테고리별 주제 목록
   */
  getTopicsByCategory(category) {
    return axios
      .get(`${API_ENDPOINT}/category/${category}`)
      .then((response) => response.data.data)
      .catch((error) => {
        console.error(`${category} 카테고리 주제 목록 조회 실패:`, error);
        throw error;
      });
  },

  /**
   * 인기 주제 목록 가져오기
   * @param {number} [limit=10] - 가져올 인기 주제 개수
   * @returns {Promise<Array>} 인기 주제 목록
   */
  getPopularTopics(limit = 10) {
    return axios
      .get(`${API_ENDPOINT}/popular`, { params: { limit } })
      .then((response) => response.data.data)
      .catch((error) => {
        console.error("인기 주제 목록 조회 실패:", error);
        throw error;
      });
  },
  generateAndSaveBestIdeas(projectId) {
    return axios
      .post(`${API_ENDPOINT}/project/${projectId}/generate`)
      .then((response) => {
        return response.data.data.map((idea) => ({
          id: idea.bi_id,
          title: idea.description, // description을 title로 매핑
          project_id: idea.project_id,
          createdAt: idea.createdAt,
          originalNode: idea.original_node || null,
        }));
      })
      .catch((error) => {
        console.error(`AI 추천 베스트 아이디어 생성 및 저장 실패:`, error);
        throw error;
      });
  },
};

export default bestIdeaApi;
