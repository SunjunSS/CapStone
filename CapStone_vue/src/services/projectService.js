 import axios from "axios";
 
 
 export const createProject =  async (user_id) => {
      

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`${API_BASE_URL}/api/project`, {
          user_id: user_id, // 실제 로그인된 사용자의 ID로 변경 필요
        });

        alert(`프로젝트 생성 완료`);

        return response;
        

      } catch (error) {
        console.error("프로젝트 생성 실패:", error);
        alert("프로젝트 생성에 실패했습니다.");
      }

  }
  