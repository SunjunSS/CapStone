import axios from "axios";

export default function uploadAudio(blob, roomId, nickname, type = "meeting") {
  return new Promise(async (resolve, reject) => {
    if (!blob || !roomId) {
      console.error("❌ Missing audio blob or roomId");
      return reject("Missing audio blob or roomId");
    }


    if (blob.size === 0) {
      console.error("❌ 빈 파일은 업로드할 수 없습니다.");
      return reject("빈 오디오 파일입니다.");
    }

    const formData = new FormData();
    formData.append("roomId", roomId);
    formData.append("type", type);
    formData.append("nickname", nickname);
    formData.append(
      "audio",
      new File([blob], "audio.mp3", { type: "audio/mp3" })
    );

    
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ 환경변수 사용
      const response = await axios.post(
        `${API_BASE_URL}/api/audio/${type}`, // ✅ API URL 수정
        formData, 
          {headers: {
          "Content-Type": "multipart/form-data", // multer가 처리할 수 있도록 설정
          }} );

      console.log(`✅ ${type}요청 : 업로드 성공!`);
      resolve(response);
    } catch (error) {
      console.error("❌ 업로드 오류:", error);
      reject(error);
    }
  });
}

// export default function uploadAudio(
//   blob,
//   roomId,
//   nickname,
//   type = "meeting",
//   maxRetries = 3
// ) {
//   return new Promise(async (resolve, reject) => {
//     if (!blob || !roomId) {
//       console.error("❌ Missing audio blob or roomId");
//       return reject("Missing audio blob or roomId");
//     }

//     if (blob.size === 0) {
//       console.error("❌ 빈 파일은 업로드할 수 없습니다.");
//       return reject("빈 오디오 파일입니다.");
//     }

//     const formData = new FormData();
//     formData.append("roomId", roomId);
//     formData.append("type", type);
//     formData.append("nickname", nickname);
//     formData.append(
//       "audio",
//       new File([blob], "audio.mp3", { type: "audio/mp3" })
//     );

//     let retries = 0;
//     let lastError = null;

//     while (retries < maxRetries) {
//       try {
//         const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//         const response = await axios.post(
//           `${API_BASE_URL}/api/audio/${type}`,
//           formData,
//           {
//             headers: {
//               "Content-Type": "multipart/form-data",
//             },
//             timeout: 10000, // 10초 타임아웃 설정
//           }
//         );

//         console.log(`✅ ${type}요청 : 업로드 성공! (시도: ${retries + 1})`);
//         return resolve(response);
//       } catch (error) {
//         lastError = error;
//         retries++;
//         console.error(`❌ 업로드 오류 (시도 ${retries}/${maxRetries}):`, error);

//         // 마지막 시도가 아니면 잠시 대기 후 재시도
//         if (retries < maxRetries) {
//           await new Promise((resolve) => setTimeout(resolve, 1000));
//         }
//       }
//     }

//     // 모든 재시도 실패 시
//     reject(lastError);
//   });
// }
