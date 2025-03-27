export async function realTimeUpload(recordedChunks, roomId, nickname) {
  
  if (recordedChunks.length === 0) return;

  const blob = new Blob(recordedChunks, { type: "audio/wav" });
  console.log("📤 10초마다 자동 업로드 진행 중...");

  if (!blob || !roomId) {
      console.error("❌ Missing roomId");
      return reject("Missing roomId");
    }

    const formData = new FormData();
    formData.append("roomId", roomId);
    formData.append(
      "stt",
      new File([blob], "audio.wav", { type: "audio/wav" })
    );

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ 환경변수 사용
      const response = await axios.post(
        `${API_BASE_URL}/api/audio/realTime`, // ✅ API URL 수정
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // upload 확인
      console.log("✅ 업로드 성공!");

      // 응답 확인
      resolve(response);
    } catch (error) {
      console.error("❌ 업로드 오류:", error);
      reject(error);
    }
  
}

