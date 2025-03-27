

export function startGoogleSTT(callback) {


  const recorder = require("node-record-lpcm16");

  // Imports the Google Cloud client library
  const { SpeechClient } = require("@google-cloud/speech");

  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    "C:/2025/CapStone/google_key/planar-lacing-454709-b6-06cea798e131.json";

  const client = new SpeechClient();

  const encoding = "LINEAR16";
  const sampleRateHertz = 16000;
  const languageCode = "ko-KR";


  const request = {
    config: {
      encoding,
      sampleRateHertz,
      languageCode,
    },
    interimResults: true, // 중간 결과 반환
  };

  const recognizeStream = client
    .streamingRecognize(request)
    .on("error", console.error)
    .on("data", (data) => {
      const transcript = data.results[0]?.alternatives[0]?.transcript;
      if (transcript && callback) {
        callback(transcript); // 결과를 콜백 함수로 전달
      }
    });

  const micStream = recorder
    .record({
      sampleRateHertz,
      threshold: 0,
      endOnSilence: false,
      verbose: false,
      recordProgram: "sox",
      silence: "4.0",
    })
    .stream()
    .on("error", console.error)
    .pipe(recognizeStream);

  console.log("🎤 Google STT 시작됨");

  return { recognizeStream, micStream };
}

export function stopGoogleSTT({ recognizeStream, micStream }) {
  if (micStream) micStream.stop();
  if (recognizeStream) recognizeStream.end();
  console.log("🛑 Google STT 종료됨");
}
