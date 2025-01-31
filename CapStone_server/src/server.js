const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { mixAudio } = require("./services/audioMix");
const multer = require("multer"); // multer 패키지 사용

const app = express();  
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5276", // 클라이언트의 도메인
    methods: ["GET", "POST"],
  },
});

// CORS 미들웨어 추가
app.use(cors());

// audio 파일을 저장할 폴더 경로

const fs = require("fs");
const tempAudioFolder = path.join(__dirname, "../storage/temp_audio");
const audioFolder = path.join(__dirname, "../storage/audio");

// multer 설정: 파일을 디스크에 저장하도록 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempAudioFolder); // 파일을 저장할 폴더 지정
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname); // 파일 확장자 추출
    const fileName = `${Date.now()}${fileExtension}`; // 고유한 이름으로 설정
    req.fileName = fileName; // fileName을 req 객체에 저장
    cb(null, fileName); // 저장할 파일 이름
  },
});

const upload = multer({ storage: storage });

// 방 정보를 저장할 객체
const rooms = {};

// 음성 녹음 여부 저장 객체
const recordingStatus = {}; // { roomId: true/false }

// audio파일을 mp3로 변환하기 위한 변수
const ffmpeg = require("fluent-ffmpeg");


// 팀원들의 음성데이터를 저장할 배열 
const roomAudioBuffers = {}; 

// 클라이언트에서 파일을 업로드하는 API
app.post("/upload", upload.single("audio"), async (req, res) => {
  const file = req.file;
  const fileName = file.originalname;
  const roomId = req.body.roomId; // formData에서 roomId 받기
  console.log(`음성녹음된 방의 roomId: ${roomId}`);
  console.log(`임시저장경로 ${tempAudioFolder}`);
  console.log(`mp3저장경로 ${audioFolder}`);

  // roomId에 해당하는 배열이 없다면 새로 생성
  if (!roomAudioBuffers[roomId]) {
    roomAudioBuffers[roomId] = [];
  }

  const inputPath = path.join(tempAudioFolder, file.filename); // 디스크에 저장된 파일 경로
  const outputPath = path.join(audioFolder, `${Date.now()}.mp3`);

  // 받은 음성 데이터를 해당 방의 배열에 저장
  roomAudioBuffers[roomId].push(inputPath);
  console.log(`audio 버퍼값: ${inputPath}`);

  // 클로바 스피치 API 호출
  const SECRET = process.env.SECRET;
  const INVOKE_URL = process.env.INVOKE_URL;

  // 요청 설정
  const requestEntity = {
    language: "ko-KR",
    completion: "sync",
    wordAlignment: true,
    fullText: true,
    noiseFiltering: true,
    diarization: { enable: true }, // diarization 객체로 수정
    noiseFiltering: true,
    format: "SRT",
  };

  // 1명일 경우
  if (file && rooms[roomId].length === 1) {
    console.log(`File received: ${file.originalname}`);
    console.log(`File name: ${fileName}`);

    console.log("변환할 파일: ", fileName);
    console.log("입력 경로 확인: ", inputPath);
    console.log("Output path for MP3:", outputPath);

    let mp3Path;

    try {
      // 1. MP3로 변환
      mp3Path = await convertToMp3(inputPath, outputPath);

      // const audioPath = path.join(tempAudioFolder,file.filename)

      // 호출
      const clovaResponse = await callClovaSpeechAPI(
        mp3Path,
        requestEntity,
        SECRET,
        INVOKE_URL
      );

      console.log("server.js / 120줄 / 응답 :", clovaResponse);

      notifyRoomClients(roomId, clovaResponse);

      // 응답 반환
      res.send({
        message: "File uploaded, converted, and processed successfully!",
        clovaResponse,
      });
    } catch (error) {
      console.error("Error during file processing:", error.message);
      res.status(500).send({ message: "Error processing file." });
    }
  } else if (roomAudioBuffers[roomId].length === rooms[roomId].length) {
    try {
      // 모든 파일 경로가 유효한지 확인
      const validAudioFiles = roomAudioBuffers[roomId].filter(
        (audioPath) => fs.existsSync(audioPath) // 파일 경로가 존재하는지 확인
      );

      // 유효한 파일이 없다면 오류 처리
      if (validAudioFiles.length !== roomAudioBuffers[roomId].length) {
        throw new Error("일부 오디오 파일이 존재하지 않습니다.");
      }

      const mixedAudioPath = await mixAudio(tempAudioFolder, audioFolder);
      console.log(`audio믹싱 성공 경로 : ${mixedAudioPath} `);

      const mp3Name = path.join(audioFolder, `${roomId}_${Date.now()}.mp3`);
      const mixedMP3 = await convertToMp3(mixedAudioPath, mp3Name);

      // 호출
      const clovaResponse = await callClovaSpeechAPI(
        mixedMP3,
        requestEntity,
        SECRET,
        INVOKE_URL
      );

      notifyRoomClients(roomId, clovaResponse);

      // 응답 반환
      res.send({
        message: "File uploaded, mixed, converted, and processed successfully!",
      });
    } catch (error) {
      console.error("Error during audioMix file processing:", error.message);
      res.status(500).send({ message: "Error processing mixing file." });
    }
  } else {
    res.status(400).send({ message: "모든 파일이 올라올 때까지 대기해주세요." });
  }
});

async function notifyRoomClients(roomId, message) {
  // 'message'는 SRT 형식의 문자열로 가정
  io.to(roomId).emit("return-recording", message); // 방에 SRT 형식의 자막 메시지 전송
}

// MP3 변환 함수
async function convertToMp3(inputPath, outputPath) {
  // audio 폴더가 없는 경우 생성 (비동기 방식으로 생성)

  const originalFormat = path.extname(inputPath); // 파일 확장자 추출

  
  //console.log("변환할 파일: ", fileName);
  console.log("입력 경로 확인: ", inputPath); // 경로 확인

  // const outputPath = path.join(
  //   noFileOutputPath,
  //   `${Date.now()}.mp3` // 파일 이름에서 확장자 제외하고 .mp3로 설정
  // );

  console.log("Output path for MP3:", outputPath);

  // 파일이 존재하는지 확인
  if (!fs.existsSync(inputPath)) {
    console.error("입력 파일이 존재하지 않습니다:", inputPath);
    throw new Error("입력 파일이 존재하지 않습니다.");
  }

  if (originalFormat.toLowerCase() !== ".mp3") {
    // MP3로 변환
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath) // 출력 파일 경로 지정
        .on("end", () => {
          console.log(`File converted to MP3: ${outputPath}`);
          resolve(outputPath); // 변환된 파일 경로 반환
        })
        .on("error", (err) => {
          console.error("Error converting file to MP3:", err.message);
          reject(err);
        })
        .run(); // ffmpeg 명령어 실행
    });
  } else {
    
    try {
      await fs.writeFile(outputPath, inputPath); // 파일 비동기 저장
      console.log(`File already in MP3 format: ${mp3Path}`);
      return mp3Path; // 저장된 MP3 파일 경로 반환
    } catch (err) {
      console.error("Error saving MP3 file:", err.message);
      throw err;
    }
  }
}

// 클로바 Speech API 호출 함수
async function callClovaSpeechAPI(filePath, requestEntity, secret, invokeUrl) {
  try {
    // 파일이 존재하는지 확인
    if (!fs.existsSync(filePath)) {
      throw new Error("파일이 존재하지 않습니다.");
    }

    // FormData 구성
    const formData = new FormData();
    formData.append("params", JSON.stringify(requestEntity));
    formData.append("media", fs.createReadStream(filePath));

    console.log("요청 파일 경로: ", filePath);

    // API 호출
    const response = await axios.post(
      `${invokeUrl}/recognizer/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "X-CLOVASPEECH-API-KEY": secret,
          Accept: "application/json",
        },
      }
    );

    console.log("HTTP 응답 코드:", response.status);

    // ✅ 응답 데이터가 SRT 형식이라면, 단순 출력
    console.log("SRT 변환 결과:\n", response.data);

    return response.data; // API 응답 반환
  } catch (error) {
    console.error("오류 발생:", error.message);
    throw error;
  }
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 방 참가 처리
  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    // 방이 없으면 생성
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // 방에 있는 참가자들의 오디오 데이터 저장
    if (!roomAudioBuffers[roomId]) {
      roomAudioBuffers[roomId] = [];
    }

    // 새로운 참가자에게 기존 참가자 목록을 전송
    socket.emit("existing-participants", {
      participants: rooms[roomId],
    });

    // 기존 참가자들에게 새로운 참가자를 알림
    socket.to(roomId).emit("new-participant", {
      participantId: socket.id,
    });

    // 참가자 목록에 추가
    rooms[roomId].push(socket.id);

    // 방 참가자 목록 업데이트 브로드캐스트
    io.to(roomId).emit("room-update", {
      participants: rooms[roomId],
    });

    console.log(`User ${socket.id} joined room ${roomId}`);
    console.log(`Room ${roomId} participants:`, rooms[roomId]);
  });

  // 녹음 시작 상태 수신
  socket.on("start-recording", (roomId) => {
    console.log(`started recording in room ${roomId}`);

    // 해당 방의 녹음 상태 true
    recordingStatus[roomId] = true;

    // 방에 있는 모든 참가자에게 녹음 상태 동기화
    io.to(roomId).emit("sync-recording", true); // 모든 참가자에게 녹음 상태 전파
    console.log(`📡 sync-recording 이벤트 전송 - Room ID: ${roomId}`);

    // 시작 시 audio초기화
    roomAudioBuffers[roomId] = [];
  });

    // // 클라이언트에서 파일을 업로드하는 API
    // app.post("/upload", upload.single("audio"), async (req, res) => {
    //   const { roomId } = req.body; // ✅ roomId 가져오기
    //   const file = req.file;
    //   const fileName = req.file.originalname;

    //   if (!roomAudioBuffers[roomId]) roomAudioBuffers[roomId] = [];

    //   roomAudioBuffers[roomId].push(file);
    //   console.log(
    //     `방 인원: ${rooms[roomId].length}명 / 받은 음성 데이터: ${roomAudioBuffers[roomId].length}`
    //   );


    //   if (file) {
    //     console.log(`File received: ${file.originalname}`);

    //     let mp3Path;

    //     // 방에 1명 있을경우
    //       if (rooms[roomId].length === 1) {
    //         console.log(`방 인원 1명, 음성 변환 시작`);
    //         try {
    //           // 1명일 경우, 첫 번째(유일한) 음성 데이터를 선택
    //           const fileBuffer = roomAudioBuffers[roomId][0];
    //           //  MP3로 변환
    //           mp3Path = await convertToMp3(fileBuffer, fileName);

    //           const clovaResponse = await callClovaSpeechAPI(mp3Path);

    //           console.log("응답 :", clovaResponse);

    //           // 응답 반환
    //           // socket.to(roomId).emit()을 사용하여 roomId에 연결된 모든 클라이언트에게 응답을 보냄
    //           socket.to(roomId).emit("return-recording", {
    //             message:
    //               "File uploaded, converted, and processed successfully!",
    //             clovaResponse,
    //           });

    //           // 응답 반환
    //           res.send({
    //             message:
    //               "File uploaded, converted, and processed successfully!",
    //             clovaResponse,
    //           });
    //         } catch (error) {
    //           console.error("Error during file processing:", error.message);
    //           res.status(500).send({ message: "Error processing file." });
    //         }
    //         // 방에 여러명이 있을 경우
    //       } else if (roomAudioBuffers[roomId].length === rooms[roomId].length) {
    //         console.log(`방 인원: ${rooms[roomId].length}명, 음성 변환 시작`);
    //         try {
    //           // audio 하나로 믹싱
    //           const mixedAudioBuffer = await mixAudio(roomAudioBuffers[roomId]);
    //           // MP3 변환 실행 (outputPath는 ../storage/audio/)
    //           const mp3OutputPath = await convertToMP3(
    //             mixedAudioBuffer,
    //             "mixed_audio.wav"
    //           );
    //           console.log(`MP3 변환 완료: ${mp3OutputPath}`);

    //           // 호출
    //           const clovaResponse = await callClovaSpeechAPI(mp3OutputPath);

    //           io.to(roomId).emit("return-recording", { clovaResponse });
    //           console.log(`${roomId}로 응답 전송`);

    //           // 기존 버퍼 초기화
    //           roomAudioBuffers[roomId] = [];
    //         } catch (error) {
    //           console.error("음성 믹싱 중 오류 발생:", error);
    //         }
    //       }
    //     } else{
    //     res.status(400).send({ message: "No file uploaded." });
    //   }
    // });

  // 참가자 통합 음성 스트리밍 처리
  // socket.on("audio-stream", async (data) => {
  //   const { roomId, audioBuffer } = data;
  //   // 음성녹음 중지된 상태면 return
  //   if (!recordingStatus[roomId]) return;

  //   // ArrayBuffer를 Buffer로 변환
  //   //const audioData = Buffer.from(audioBuffer);

  //   if (!roomAudioBuffers[roomId]) roomAudioBuffers[roomId] = [];

  //   // audioBuffer를 Buffer로 변환
  //   const buffer = Buffer.from(audioBuffer);

  //   roomAudioBuffers[roomId].push(buffer);

  //   console.log(
  //     `방 인원: ${rooms[roomId].length}명 / 받은 음성 데이터: ${roomAudioBuffers[roomId].length}`
  //   );

  //   // 방 인원이 1명인 경우, 음성 믹싱 없이 바로 텍스트 변환
  //   if (rooms[roomId].length === 1) {
  //     console.log(`방 인원 1명, 음성 변환 시작`);
  //     try {
  //       // 1명일 경우, 첫 번째(유일한) 음성 데이터를 선택
  //       const fileBuffer = roomAudioBuffers[roomId][0];

  //       const getFormattedTime = () => {
  //         const now = new Date();
  //         const hours = String(now.getHours()).padStart(2, "0");
  //         const minutes = String(now.getMinutes()).padStart(2, "0");
  //         const seconds = String(now.getSeconds()).padStart(2, "0");
  //         return `${hours}-${minutes}-${seconds}`;
  //       };

  //       const fileName = `${getFormattedTime()}.wav`; // "12-23-10.wav" 형식(시-분-초)

  //       // temp_audio 폴더에 원본 파일 저장
  //       const tempFilePath = path.join(tempAudioFolder, fileName);
  //       await fs.promises.writeFile(tempFilePath, fileBuffer);
  //       console.log(`Temp audio file saved: ${tempFilePath}`);

  //       // MP3 변환 실행 (outputPath는 ../storage/audio/)
  //       const mp3OutputPath = await convertToMP3(tempFilePath, audioFolder);
  //       console.log(`MP3 변환 완료: ${mp3OutputPath}`);

  //       // 호출
  //       const clovaResponse = await callClovaSpeechAPI(mp3OutputPath);

  //       io.to(roomId).emit("realtime-speech", { clovaResponse });
  //       console.log(`${roomId}로 응답 전송`);

  //       // 기존 버퍼 초기화
  //       roomAudioBuffers[roomId] = [];
  //     } catch (error) {
  //       console.error("음성 변환 중 오류 발생:", error);
  //     }
  //   } else if (roomAudioBuffers[roomId].length === rooms[roomId].length) {
  //     console.log(`방 인원: ${rooms[roomId].length}명, 음성 변환 시작`);
  //     try {
  //       // audio 하나로 믹싱
  //       const mixedAudioPath = await mixAudio(roomAudioBuffers[roomId]);
  //       // MP3 변환 실행 (outputPath는 ../storage/audio/)
  //       const mp3OutputPath = await convertToMP3(mixedAudioPath, audioFolder);
  //       console.log(`MP3 변환 완료: ${mp3OutputPath}`);

  //       // 호출
  //       const clovaResponse = await callClovaSpeechAPI(mp3OutputPath);

  //       io.to(roomId).emit("return-recording", { clovaResponse });
  //       console.log(`${roomId}로 응답 전송`);

  //       // 기존 버퍼 초기화
  //       roomAudioBuffers[roomId] = [];
  //     } catch (error) {
  //       console.error("음성 믹싱 중 오류 발생:", error);
  //     }
  //   }
  // });

  // 녹음 중지 처리
  socket.on("stop-recording", (roomId) => {
    console.log(`Recording stopped in room ${roomId}`);
    recordingStatus[roomId] = false;
    io.to(roomId).emit("sync-recording", false); // 클라이언트 동기화
  });

  // WebRTC 시그널링 처리
  socket.on("signal", ({ targetId, signal }) => {
    try {
      console.log(
        `Signal from ${socket.id} to ${targetId}:`,
        signal.type || "ICE candidate"
      );

      // 대상 사용자에게 시그널 전달
      io.to(targetId).emit("signal", {
        senderId: socket.id,
        signal: signal,
      });
    } catch (error) {
      console.error(`❌ Signal processing error: ${error.message}`);

      // 오류를 보낸 클라이언트에게 알림
      socket.emit("signal-error", {
        error: `Signal processing failed: ${error.message}`,
        targetId,
        signalType: signal.type || "ICE candidate",
      });
    }
  });

  // 연결 해제 처리
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // 모든 방에서 사용자 제거
    for (const roomId in rooms) {
      if (rooms[roomId].includes(socket.id)) {
        // 방에서 사용자 제거
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);

        // 방 참가자 목록 업데이트
        io.to(roomId).emit("room-update", {
          participants: rooms[roomId],
        });

        // 다른 참가자들에게 사용자 연결 해제 알림
        io.to(roomId).emit("user-disconnected", socket.id);

        console.log(`User ${socket.id} left room ${roomId}`);
        console.log(`Room ${roomId} participants:`, rooms[roomId]);

        // 방이 비었으면 삭제 (방, 음성스트림)
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
          delete roomAudioBuffers[roomId];
          console.log(`Room ${roomId} deleted`);
        }
      }
    }
  });
});

// 에러 처리
server.on("error", (error) => {
  console.error("Server error:", error);
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});