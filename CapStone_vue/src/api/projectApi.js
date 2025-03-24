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
    const response = await axios.get(`${getProjectUrl()}/${userId}`); // ✅ params 방식 사용
    console.log("🟢 프로젝트 리스트 응답:", response.data);

    if (!response.data.projects) {
      throw new Error(
        "❌ 프로젝트 조회 실패: 응답 데이터에 projects가 없습니다."
      );
    }

    return response.data.projects; // ✅ projects 배열만 반환
  } catch (error) {
    console.error("❌ 프로젝트 조회 오류:", error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    await axios.delete(`${getProjectUrl()}/${projectId}`);
  } catch (error) {
    console.error("프로젝트 삭제 오류:", error);
    throw error;
  }
};

export const updateProject = async (projectId, updatedData) => {
  try {
    const response = await axios.patch(
      `${getProjectUrl()}/${projectId}`,
      updatedData
    );
    return response.data;
  } catch (error) {
    console.error("프로젝트 수정 오류:", error);
    throw error;
  }
};

export const addUserToProject = async (projectId, email, role) => {
  try {
    const response = await axios.post(
      `${getProjectUrl()}/${projectId}/members`,
      {
        email: email,
        role: role,
      }
    );

    console.log("🟢 유저 추가 응답:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 프로젝트에 유저 추가 오류:", error);
    throw error;
  }
};

// ✅ 새로 추가된 부분: 프로젝트 멤버 조회
export const getProjectMembers = async (projectId) => {
  try {
    const response = await axios.get(`${getProjectUrl()}/${projectId}/members`);
    console.log("🟢 멤버 조회 응답:", response.data);
    return response.data.members;
  } catch (error) {
    console.error("❌ 프로젝트 멤버 조회 오류:", error);
    throw error;
  }
};
