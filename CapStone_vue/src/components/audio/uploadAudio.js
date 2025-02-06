import axios from "axios";


// WebM 파일을 서버로 전송하는 함수 / POST방식으로 한번에 데이터 파일을 보낼 때 사용함.
export default function uploadAudio(blob, roomId) {
    return new Promise(async (resolve, reject) => {
      const formData = new FormData();
      formData.append("roomId", roomId); // ✅ roomId 추가
      formData.append("audio", blob, "audio.wav"); // ✅ audio파일 추가

      try {
        const response = await axios.post(
          "http://localhost:3000/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("클로바 요청 응답: ", response.data.clovaResponse);

        resolve(response); // 성공하면 resolve로 response 반환
      } catch (error) {
        console.error("Error uploading file:", error);
        reject(error); // 에러 발생 시 reject
      }
    });
  }

  //module.exports = {uploadAudio};