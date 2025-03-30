



module.exports = (socket) => {


  const { SpeechClient } = require("@google-cloud/speech");

  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    "../google_key/planar-lacing-454709-b6-06cea798e131.json";

  const client = new SpeechClient();
  const encoding = "WEBM_OPUS";
  const sampleRateHertz = 16000;
  const languageCode = "ko-KR";

  const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
    },
    interimResults: true, // 중간 결과 반환
  };
 

  // Google STT 스트림 생성
  const recognizeStream = client
    .streamingRecognize(request)
    .on("error", console.error)
    .on("data", (data) => {
      const transcript = data.results[0]?.alternatives[0]?.transcript;
      
      if (transcript) console.log(`STT: ${transcript}`);

      console.log("hi")
    });

  // 음성 데이터 수신 처리
  socket.on("streamingData", (audioBuffer) => {
    if (!audioBuffer || !(audioBuffer instanceof Uint8Array)) {
      console.error("❌ Received invalid audioBuffer:", audioBuffer);
      return;
    }

    const buffer = Buffer.from(audioBuffer);
    if (!recognizeStream.destroyed) {
          recognizeStream.write(buffer);
        } else {
          console.warn("⚠️ STT 스트림이 종료되어 데이터를 보낼 수 없습니다.");
        }
      });

      socket.on("disconnect", () => {
        console.log("🚪 클라이언트 연결 해제, STT 스트림 종료");
        recognizeStream.end(); // 스트림 종료
      });
  
};
