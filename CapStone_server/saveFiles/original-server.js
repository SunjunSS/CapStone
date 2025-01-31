const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5276", // 클라이언트의 도메인
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// 방 정보를 저장할 객체
const rooms = {};

// 참가자 음성 스트림을 저장할 객체
const teamStreams = {}; 

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