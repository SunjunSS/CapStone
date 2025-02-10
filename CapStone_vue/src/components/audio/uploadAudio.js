import axios from "axios";

export default function uploadAudio(blob, roomId) {
  return new Promise(async (resolve, reject) => {
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
      const response = await axios.post(
        "http://13.125.88.168:3000/api/audio/upload", // ✅ API URL 수정
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ 업로드 성공! 클로바 응답:", response.data.clovaResponse);
      resolve(response);
    } catch (error) {
      console.error("❌ 업로드 오류:", error);
      reject(error);
    }
  });
}
