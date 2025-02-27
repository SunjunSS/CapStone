import axios from "axios";

import API_BASE_URL from "../config/apiConfig"; // ✅ API URL 설정 파일 가져오기

const getProjectUrl = () => `${API_BASE_URL}/api/project`;

export const createProject = async (userId) => {
  try {
    const response = await axios.post(`${getProjectUrl()}`, {
      user_id: userId,
    });

    console.log("🟢 서버 응답:", response.data);

    if (!response.data.project) {
      throw new Error(
        "❌ 프로젝트 생성 실패: 응답 데이터에 project가 없습니다."
      );
    }

    return response.data.project; // ✅ 프로젝트 데이터만 반환
  } catch (error) {
    console.error("❌ 프로젝트 생성 오류:", error);
    throw error;
  }
};

export const getUserProjects = async (userId) => {
  try {
    const response = await axios.get(`/api/projects?user_id=${userId}`);
    return response.data; // 프로젝트 리스트 반환
  } catch (error) {
    console.error("프로젝트 조회 오류:", error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    await axios.delete(`/api/projects/${projectId}`);
  } catch (error) {
    console.error("프로젝트 삭제 오류:", error);
    throw error;
  }
};

export const updateProject = async (projectId, updatedData) => {
  try {
    const response = await axios.patch(
      `/api/projects/${projectId}`,
      updatedData
    );
    return response.data;
  } catch (error) {
    console.error("프로젝트 수정 오류:", error);
    throw error;
  }
};
