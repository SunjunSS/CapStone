import axios from "axios";

export async function fetchHeaderBlob() {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(
          `${API_BASE_URL}/static/audio/headerBlob/headerBlob.webm`,
          {
            responseType: "blob", // 파일을 Blob 형태로 가져오기
          }
        );

        // 파일을 반환 (Blob 형태)
        return response.data; // 이 Blob을 파일로 처리할 수 있습니다.
      } catch (error) {
        if (error.response) {
          // 서버 응답이 있을 때
          console.error("서버 오류:", error.response.data);
          alert(
            `서버 오류: ${error.response.status} ${error.response.statusText}`
          );
        } else if (error.request) {
          // 요청이 보내졌지만 응답을 받지 못했을 때
          console.error("응답 없음:", error.request);
          alert("서버에 응답이 없습니다. 나중에 다시 시도해 주세요.");
        } else {
          // 다른 에러
          console.error("에러 발생:", error.message);
          alert(`에러 발생: ${error.message}`);
        }
        throw error; // 상위로 에러 전달
      }
  
};
