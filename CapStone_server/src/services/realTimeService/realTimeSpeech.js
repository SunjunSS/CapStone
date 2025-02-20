const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

require("dotenv").config();

// .env 파일에 정의된 SECRET 환경 변수 불러오기
// 인증 토큰 (Bearer Token)
const secretKey = process.env.SECRET;

// .proto 파일 경로
const PROTO_PATH = "./models/realTimeSpeech.proto";

// gRPC 서비스 정의 로드
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const realTimeSpeechProto =
  grpc.loadPackageDefinition(packageDefinition).clova.speech;

// gRPC 채널 생성 (보안 채널)
const client = new realTimeSpeechProto.SpeechService(
  "clovaspeech-gw.ncloud.com:50051",
  grpc.credentials.createSsl()
);

// 인증 메타데이터 설정
const metadata = new grpc.Metadata();
metadata.add("authorization", `Bearer ${secretKey}`);

// Config JSON 설정
const configJson = {
  transcription: {
    language: "ko", // 한국어 설정
  },
  keywordBoosting: {
    boostings: [
      {
        words: "안녕하세요,테스트,음성인식",
        weight: 1.5,
      },
      {
        words: "실시간,딥러닝,AI",
        weight: 1.0,
      },
    ],
  },
  semanticEpd: {
    skipEmptyText: true,
    useWordEpd: true,
    usePeriodEpd: true,
  },
};

// 요청 객체 생성
const request = {
  audio_data: Buffer.from([]), // 여기에 실제 음성 데이터가 들어갑니다.
  config: JSON.stringify(configJson), // JSON 형식으로 변환하여 전달
};

function startRealTimeSpeechRecognition(audioBuffer, callback) {
  // 요청 객체 생성
  const request = {
    audio_data: audioBuffer, // 음성 데이터
    config: JSON.stringify(configJson), // ConfigJson요청을 JSON형식으로 변환하여 전달
  };

  const call = client.realTimeStreaming(request, metadata);

  call.on("data", (response) => {
    callback(null, response.transcript);
  });

  call.on("error", (err) => {
    callback(err, null);
  });

  call.on("end", () => {
    console.log("음성 인식 종료");
  });
}

module.exports = startRealTimeSpeechRecognition;
