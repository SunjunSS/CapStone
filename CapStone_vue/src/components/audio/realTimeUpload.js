export async function realTimeUpload(recordedChunks, roomId) {
  
  if (recordedChunks.length === 0) return;

  const blob = new Blob(recordedChunks, { type: "audio/wav" });
  console.log("📤 25초마다 자동 업로드 진행 중...");

  if (!blob || !roomId) {
      console.error("❌ Missing audio blob or roomId");
      return reject("Missing audio blob or roomId");
    }

    const formData = new FormData();
    formData.append("roomId", roomId);
    formData.append(
      "audio",
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

      console.log("✅ 업로드 성공!");

       if (response.data && response.data.nodes) {
         updateMindMap(response.data.nodes);
       }

       
      resolve(response);
    } catch (error) {
      console.error("❌ 업로드 오류:", error);
      reject(error);
    }
  
}

