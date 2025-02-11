const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // CORS 허용
});

const rooms = {}; // 방별 사용자 저장

io.on("connection", (socket) => {
  console.log(`🟢 사용자 연결됨: ${socket.id}`);

  // 방 참가
  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = {};
    rooms[roomId][socket.id] = userId;
    console.log(`📢 ${userId} 님이 ${roomId} 방에 입장`);

    // 현재 방의 사용자 목록 전달
    io.to(roomId).emit("room-update", {
      participants: Object.values(rooms[roomId]),
    });
  });



  socket.on("mouse-move", ({ roomId, userId, x, y }) => {
    if (typeof x === "undefined" || typeof y === "undefined") {
      console.error(`🚨 x 또는 y 값이 없습니다! userId: ${userId}`);
      return;
    }
    socket.to(roomId).emit("update-mouse", { userId, x, y });
  });


  // 방 나가기
  socket.on("leave-room", ({ roomId, userId }) => {
    if (rooms[roomId]) {
      delete rooms[roomId][socket.id];
      io.to(roomId).emit("user-disconnected", userId);
      console.log(`❌ ${userId} 님이 ${roomId} 방에서 나감`);
    }
  });

  // 연결 해제
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId][socket.id]) {
        const userId = rooms[roomId][socket.id];
        delete rooms[roomId][socket.id];
        io.to(roomId).emit("user-disconnected", userId);
      }
    }
    console.log(`🔴 사용자 연결 종료: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log("🚀 서버 실행 중 (포트 3000)");
});
