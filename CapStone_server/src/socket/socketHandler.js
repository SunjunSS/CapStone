/**
 * 음성 채팅방 관리 파일일
 *
 */

const rooms = {};
const roomAudioBuffers = {};
const recordingStatus = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    // 방 참가 처리
    socket.on("join-room", ({ roomId, userId }) => {
      socket.join(roomId);
      socket.userId = userId; // 사용자 ID를 socket에 저장

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
        participantId: userId,
      });
      // 참가자 목록에 추가
      rooms[roomId].push(userId);
      // 방 참가자 목록 업데이트 브로드캐스트
      io.to(roomId).emit("room-update", {
        participants: rooms[roomId],
      });
      console.log(`User ${userId} joined room ${roomId}`);
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

    // 마우스 이동 정보 전달
    socket.on("mouse-move", ({ roomId, x, y }) => {
      socket.to(roomId).emit("update-mouse", {
          userId: socket.userId,
          x,y,
          nickname: `${roomId + socket.userId}`,
        });
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


};
