const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { mixAudio } = require("../src/services/audioMix");
const { convertToMP3 } = require("../src/services/convertToMP3");
const { callClovaSpeechAPI } = require("../src/services/callClovaSpeech");

const app = express();  
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5276", // 클라이언트의 도메인
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// audio 임시, 영구 저장 경로
const path = require("path");
const upload = require("../src/config/upload");

const fs = require("fs");
const tempAudioFolder = path.join(__dirname, "../storage/temp_audio");
const audioFolder = path.join(__dirname, "../storage/audio");

// 방 정보  저장 객체
const rooms = {};

// 음성 녹음 여부 저장 객체
const recordingStatus = {}; // { roomId: true/false }

// 참가자 음성 스트림을 저장할 객체
const teamStreams = {}; 

// 팀원들의 음성데이터를 저장할 배열 
const roomAudioBuffers = []; 


// user가 회의방에 참가할 때 처리
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

    // 클라이언트에서 파일을 업로드하는 API
    app.post("/upload", upload.single("audio"), async (req, res) => {
      const { roomId } = req.body; // ✅ roomId 가져오기
      const file = req.file;
      const fileName = req.file.originalname;

      if (!roomAudioBuffers[roomId]) roomAudioBuffers[roomId] = [];

      roomAudioBuffers[roomId].push(file);
      console.log(
        `방 인원: ${rooms[roomId].length}명 / 받은 음성 데이터: ${roomAudioBuffers[roomId].length}`
      );


      if (file) {
        console.log(`File received: ${file.originalname}`);

        let mp3Path;

        // 방에 1명 있을경우
          if (rooms[roomId].length === 1) {
            console.log(`방 인원 1명, 음성 변환 시작`);
            try {
              // 1명일 경우, 첫 번째(유일한) 음성 데이터를 선택
              const fileBuffer = roomAudioBuffers[roomId][0];
              //  MP3로 변환
              mp3Path = await convertToMp3(fileBuffer, fileName);

              const clovaResponse = await callClovaSpeechAPI(mp3Path);

              console.log("응답 :", clovaResponse);

              // 응답 반환
              // socket.to(roomId).emit()을 사용하여 roomId에 연결된 모든 클라이언트에게 응답을 보냄
              socket.to(roomId).emit("return-recording", {
                message:
                  "File uploaded, converted, and processed successfully!",
                clovaResponse,
              });

              // 응답 반환
              res.send({
                message:
                  "File uploaded, converted, and processed successfully!",
                clovaResponse,
              });
            } catch (error) {
              console.error("Error during file processing:", error.message);
              res.status(500).send({ message: "Error processing file." });
            }
            // 방에 여러명이 있을 경우
          } else if (roomAudioBuffers[roomId].length === rooms[roomId].length) {
            console.log(`방 인원: ${rooms[roomId].length}명, 음성 변환 시작`);
            try {
              // audio 하나로 믹싱
              const mixedAudioBuffer = await mixAudio(roomAudioBuffers[roomId]);
              // MP3 변환 실행 (outputPath는 ../storage/audio/)
              const mp3OutputPath = await convertToMP3(
                mixedAudioBuffer,
                "mixed_audio.wav"
              );
              console.log(`MP3 변환 완료: ${mp3OutputPath}`);

              // 호출
              const clovaResponse = await callClovaSpeechAPI(mp3OutputPath);

              io.to(roomId).emit("return-recording", { clovaResponse });
              console.log(`${roomId}로 응답 전송`);

              // 기존 버퍼 초기화
              roomAudioBuffers[roomId] = [];
            } catch (error) {
              console.error("음성 믹싱 중 오류 발생:", error);
            }
          }
        } else{
        res.status(400).send({ message: "No file uploaded." });
      }
    });

  // 참가자 통합 음성 스트리밍 처리
  socket.on("audio-stream", async (data) => {
    const { roomId, audioBuffer } = data;
    // 음성녹음 중지된 상태면 return
    if (!recordingStatus[roomId]) return;

    // ArrayBuffer를 Buffer로 변환
    //const audioData = Buffer.from(audioBuffer);

    if (!roomAudioBuffers[roomId]) roomAudioBuffers[roomId] = [];

    // audioBuffer를 Buffer로 변환
    const buffer = Buffer.from(audioBuffer);

    roomAudioBuffers[roomId].push(buffer);

    console.log(
      `방 인원: ${rooms[roomId].length}명 / 받은 음성 데이터: ${roomAudioBuffers[roomId].length}`
    );

    // 방 인원이 1명인 경우, 음성 믹싱 없이 바로 텍스트 변환
    if (rooms[roomId].length === 1) {
      console.log(`방 인원 1명, 음성 변환 시작`);
      try {
        // 1명일 경우, 첫 번째(유일한) 음성 데이터를 선택
        const fileBuffer = roomAudioBuffers[roomId][0];

        const getFormattedTime = () => {
          const now = new Date();
          const hours = String(now.getHours()).padStart(2, "0");
          const minutes = String(now.getMinutes()).padStart(2, "0");
          const seconds = String(now.getSeconds()).padStart(2, "0");
          return `${hours}-${minutes}-${seconds}`;
        };

        const fileName = `${getFormattedTime()}.wav`; // "12-23-10.wav" 형식(시-분-초)

        // temp_audio 폴더에 원본 파일 저장
        const tempFilePath = path.join(tempAudioFolder, fileName);
        await fs.promises.writeFile(tempFilePath, fileBuffer);
        console.log(`Temp audio file saved: ${tempFilePath}`);

        // MP3 변환 실행 (outputPath는 ../storage/audio/)
        const mp3OutputPath = await convertToMP3(tempFilePath, audioFolder);
        console.log(`MP3 변환 완료: ${mp3OutputPath}`);

        // 호출
        const clovaResponse = await callClovaSpeechAPI(mp3OutputPath);

        io.to(roomId).emit("realtime-speech", { clovaResponse });
        console.log(`${roomId}로 응답 전송`);

        // 기존 버퍼 초기화
        roomAudioBuffers[roomId] = [];
      } catch (error) {
        console.error("음성 변환 중 오류 발생:", error);
      }
    } else if (roomAudioBuffers[roomId].length === rooms[roomId].length) {
      console.log(`방 인원: ${rooms[roomId].length}명, 음성 변환 시작`);
      try {
        // audio 하나로 믹싱
        const mixedAudioPath = await mixAudio(roomAudioBuffers[roomId]);
        // MP3 변환 실행 (outputPath는 ../storage/audio/)
        const mp3OutputPath = await convertToMP3(mixedAudioPath, audioFolder);
        console.log(`MP3 변환 완료: ${mp3OutputPath}`);

        // 호출
        const clovaResponse = await callClovaSpeechAPI(mp3OutputPath);

        io.to(roomId).emit("return-recording", { clovaResponse });
        console.log(`${roomId}로 응답 전송`);

        // 기존 버퍼 초기화
        roomAudioBuffers[roomId] = [];
      } catch (error) {
        console.error("음성 믹싱 중 오류 발생:", error);
      }
    }
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
          delete teamStreams[roomId];
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