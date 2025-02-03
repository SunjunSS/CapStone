const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const { convertToMP3 } = require("./services/convertToMP3");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { mixAudio } = require("./services/audioMix");
const multer = require("multer"); // multer 패키지 사용
const { callClovaSpeechAPI } = require("./services/callClovaSpeech");

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
      mp3Path = await convertToMP3(inputPath, outputPath);


      console.log(`변환된 mp3 경로: ${mp3Path}`);
      // 호출
      const clovaResponse = await callClovaSpeechAPI(
        mp3Path
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
      const mixedMP3 = await convertToMP3(mixedAudioPath, mp3Name);

      // 호출
      const clovaResponse = await callClovaSpeechAPI(mixedMP3);

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