// socketHandler.js

const rooms = {};
const roomAudioBuffers = {};
const recordingStatus = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 사용자 연결됨:", socket.id);

    // 방 참가 처리
    socket.on("join-room", ({ roomId, userId }) => {
      socket.join(roomId);
      socket.userId = userId;

      // 방이 없으면 생성
      if (!rooms[roomId]) {
        rooms[roomId] = {};
      }
      rooms[roomId][socket.id] = userId;

      // 방에 있는 참가자들의 오디오 데이터 저장
      if (!roomAudioBuffers[roomId]) {
        roomAudioBuffers[roomId] = [];
      }

      // 새로운 참가자에게 기존 참가자 목록을 전송
      socket.emit("existing-participants", {
        participants: Object.values(rooms[roomId]),
      });

      // 기존 참가자들에게 새로운 참가자를 알림
      socket.to(roomId).emit("new-participant", {
        participantId: userId,
      });

      // 방 참가자 목록 업데이트 브로드캐스트
      io.to(roomId).emit("room-update", {
        participants: Object.values(rooms[roomId]),
      });

      console.log(`📢 ${userId} 님이 ${roomId} 방에 입장`);
      console.log(`Room ${roomId} participants:`, rooms[roomId]);
    });

    // 녹음 시작 상태 수신
    socket.on("start-recording", (roomId) => {
      console.log(`started recording in room ${roomId}`);
      recordingStatus[roomId] = true;
      io.to(roomId).emit("sync-recording", true);
      console.log(`📡 sync-recording 이벤트 전송 - Room ID: ${roomId}`);
      roomAudioBuffers[roomId] = [];
    });

    // 녹음 중지 처리
    socket.on("stop-recording", (roomId) => {
      console.log(`Recording stopped in room ${roomId}`);
      recordingStatus[roomId] = false;
      io.to(roomId).emit("sync-recording", false);
    });

    // 마우스 이동 정보 전달
    socket.on("mouse-move", ({ roomId, userId, x, y }) => {
      if (typeof x === "undefined" || typeof y === "undefined") {
        console.error(`🚨 x 또는 y 값이 없습니다! userId: ${userId}`);
        return;
      }
      
      socket.to(roomId).emit("update-mouse", { userId, x, y });
    });

    // WebRTC 시그널링 처리
    socket.on("signal", ({ targetId, signal }) => {
      try {
        // console.log(
        //   `Signal from ${socket.id} to ${targetId}:`,
        //   signal.type || "ICE candidate"
        // );
        io.to(targetId).emit("signal", {
          senderId: socket.id,
          signal: signal,
        });
      } catch (error) {
        console.error(`❌ Signal processing error: ${error.message}`);
        socket.emit("signal-error", {
          error: `Signal processing failed: ${error.message}`,
          targetId,
          signalType: signal.type || "ICE candidate",
        });
      }
    });

    // 방 나가기
    socket.on("leave-room", ({ roomId, userId }) => {
      if (rooms[roomId]) {
        delete rooms[roomId][socket.id];
        io.to(roomId).emit("user-disconnected", userId);
        console.log(`❌ ${userId} 님이 ${roomId} 방에서 나감`);
      }
    });

    // 연결 해제 처리
    socket.on("disconnect", () => {
      console.log("🔴 사용자 연결 종료:", socket.id);
      for (const roomId in rooms) {
        if (rooms[roomId][socket.id]) {
          const userId = rooms[roomId][socket.id];
          delete rooms[roomId][socket.id];
          io.to(roomId).emit("user-disconnected", userId);

          // 방이 비었으면 삭제
          if (Object.keys(rooms[roomId]).length === 0) {
            delete rooms[roomId];
            delete roomAudioBuffers[roomId];
            console.log(`Room ${roomId} deleted`);
          }
        }
      }
    });
  });
};
