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

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      if (!rooms[roomId]) rooms[roomId] = [];
      if (!roomAudioBuffers[roomId]) roomAudioBuffers[roomId] = [];

      rooms[roomId].push(socket.id);
      io.to(roomId).emit("room-update", { participants: rooms[roomId] });
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("start-recording", (roomId) => {
      recordingStatus[roomId] = true;
      io.to(roomId).emit("sync-recording", true);
    });

    socket.on("stop-recording", (roomId) => {
      recordingStatus[roomId] = false;
      io.to(roomId).emit("sync-recording", false);
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
        io.to(roomId).emit("room-update", { participants: rooms[roomId] });
        if (rooms[roomId].length === 0) delete rooms[roomId];
      }
      console.log("User disconnected:", socket.id);
    });
  });
};
