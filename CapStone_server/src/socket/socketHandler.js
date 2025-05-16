const loginHandler = require("./LoginHandler.js");
const nodeService = require("../services/nodeService/nodeService"); // ✅ nodeService 추가

const { deleteFiles } = require("../services/audioService/deleteFiles.js");

const path = require("path");


const audioFolderMeeting = (roomId) =>
  path.join(__dirname, "../../storage/audio/meeting", roomId);
const tempAudioFolderMeeting = (roomId) =>
  path.join(__dirname, "../../storage/temp_audio/meeting", roomId);
const audioFolderRealTime = (roomId) =>
  path.join(__dirname, "../../storage/audio/realTime", roomId);
const tempAudioFolderRealTime = (roomId) =>
  path.join(__dirname, "../../storage/temp_audio/realTime", roomId);

const rooms = {};
const roomAudioBuffers = {};
const recordingStatus = {};
const socketSessions = require("./socketSessions");
const roomNodes = {}; // 노드 저장 객체 추가 (누락되어 있었음)
const roomNicknames = {}; // 방별 닉네임 정보 저장 객체 추가
const userModes = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 사용자 연결됨:", socket.id);

    // 로그인 핸들러 실행
    loginHandler(socket);

    // 방 참가 처리
    socket.on("join-room", ({ roomId, userId, nickname }) => {
      socket.join(roomId);

      const userSocketId = socketSessions[userId]; // 로그인된 사용자의 socket.id 가져오기
      if (userSocketId) {
        // 이미 로그인된 사용자의 socket.id로 방 참여
        socket.join(roomId);
        console.log(`✅ ${userId} 님이 ${roomId} 방에 입장`);
      }

      // 방이 없으면 생성
      if (!rooms[roomId]) {
        rooms[roomId] = {};
      }
      rooms[roomId][socket.id] = userId;

      // 닉네임 정보 저장
      if (!roomNicknames[roomId]) {
        roomNicknames[roomId] = {};
      }
      if (nickname) {
        roomNicknames[roomId][userId] = nickname;
        console.log(`📝 닉네임 등록: ${userId} => ${nickname}`);
      } 

      // 방에 있는 참가자들의 오디오 데이터 저장
      if (!roomAudioBuffers[roomId]) {
        roomAudioBuffers[roomId] = [];
      }

      // 새로운 참가자에게 기존 참가자 목록과 닉네임 정보를 전송
      socket.emit("existing-participants", {
        participants: Object.values(rooms[roomId]),
        nicknames: roomNicknames[roomId],
      });

      // 기존 참가자들에게 새로운 참가자를 알림
      socket.to(roomId).emit("new-participant", {
        participantId: userId,
        nickname: nickname,
      });

      // 방 참가자 목록 업데이트 브로드캐스트
      io.to(roomId).emit("room-update", {
        participants: Object.values(rooms[roomId]),
      });

      // 방 전체에 닉네임 정보 동기화
      io.to(roomId).emit("sync-nicknames", roomNicknames[roomId]);

      console.log(`📢 ${userId} 님이 ${roomId} 방에 입장`);
      console.log(`Room ${roomId} participants:`, rooms[roomId]);
    });

    // 닉네임 업데이트 처리 핸들러 추가
    socket.on("update-nickname", ({ roomId, userId, nickname }) => {
      if (!roomNicknames[roomId]) {
        roomNicknames[roomId] = {};
      }

      // 닉네임 정보 업데이트
      roomNicknames[roomId][userId] = nickname;
      console.log(`🔄 닉네임 업데이트: ${userId} => ${nickname}`);

      // 방 전체에 닉네임 정보 동기화
      io.to(roomId).emit("sync-nicknames", roomNicknames[roomId]);
    });

    // 녹음 시작 상태 수신
    socket.on("start-recording", (roomId) => {
      console.log(`started recording in room ${roomId}`);


      // 폴더에 남은 mp3 삭제
      deleteFiles(tempAudioFolderMeeting(roomId));
      deleteFiles(audioFolderMeeting(roomId));
      deleteFiles(tempAudioFolderRealTime(roomId));
      deleteFiles(audioFolderRealTime(roomId));

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

    // ✅ 노드 추가 (방의 모든 참가자에게 변경 사항 전송)
    socket.on("add-node", ({ roomId, node }) => {
      if (!roomNodes[roomId]) roomNodes[roomId] = [];

      // 🔹 같은 노드가 존재하는지 확인
      const exists = roomNodes[roomId].some(
        (existingNode) => existingNode.id === node.id
      );
      if (!exists) {
        roomNodes[roomId].push(node);

        console.log("🟢 새로운 노드 추가됨:", node);
        io.to(roomId).emit("nodeAdded", node); // ✅ 변경 사항 있을 때만 전송
      }
    });

    // ✅ 노드 삭제 (방의 모든 참가자에게 변경 사항 전송)
    socket.on("delete-node", ({ roomId, nodeId }) => {
      if (roomNodes[roomId]) {
        const beforeDeleteCount = roomNodes[roomId].length;
        roomNodes[roomId] = roomNodes[roomId].filter(
          (node) => node.id !== nodeId
        );

        // 🔹 삭제된 경우에만 이벤트 전송
        if (roomNodes[roomId].length !== beforeDeleteCount) {
          console.log("🗑️ 노드 삭제됨:", nodeId);
          io.to(roomId).emit("nodeDeleted", nodeId);
        }
      }
    });

    // ✅ 노드 수정 (방의 모든 참가자에게 변경 사항 전송)
    socket.on("update-node", ({ roomId, updatedNode }) => {
      if (roomNodes[roomId]) {
        const index = roomNodes[roomId].findIndex(
          (node) => node.id === updatedNode.id
        );
        if (
          index !== -1 &&
          JSON.stringify(roomNodes[roomId][index]) !==
            JSON.stringify(updatedNode)
        ) {
          roomNodes[roomId][index] = updatedNode;

          console.log("✏️ 노드 수정됨:", updatedNode);
          io.to(roomId).emit("nodeUpdated", updatedNode);
        }
      }
    });

    // ✅ 노드 이동 이벤트 처리
    socket.on(
      "move-node",
      async ({ movedNodeId, newParentId, roomId, project_id }) => {
        console.log("📡 [Socket] move-node 이벤트 수신:", {
          movedNodeId,
          newParentId,
          roomId,
          project_id,
        });

        try {
          const updatedNode = await nodeService.moveNode(
            movedNodeId,
            newParentId,
            project_id
          );

          console.log("📡 [Socket] 이동된 노드 브로드캐스트:", updatedNode);

          // ✅ 방(roomId)의 모든 참가자에게 이동된 노드 정보를 전송
          io.to(roomId).emit("nodeMoved", updatedNode);
        } catch (error) {
          console.error("❌ [Socket] 노드 이동 중 오류 발생:", error.message);
        }
      }
    );

    // WebRTC 시그널링 처리
    socket.on("signal", ({ targetId, signal }) => {
      try {
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

        // 닉네임 정보 삭제
        if (roomNicknames[roomId] && roomNicknames[roomId][userId]) {
          delete roomNicknames[roomId][userId];
        }

        io.to(roomId).emit("user-disconnected", userId);

        // 닉네임 정보 업데이트 브로드캐스트
        io.to(roomId).emit("sync-nicknames", roomNicknames[roomId]);

        console.log(`❌ ${userId} 님이 ${roomId} 방에서 나감`);
      }
    });

    // 역할 변경 이벤트 처리
    socket.on("roleChanged", (data) => {
      console.log(
        `👤 역할 변경 이벤트: ${data.email}의 역할이 ${data.role}로 변경됨`
      );

      // 같은 방에 있는 다른 모든 클라이언트에게 전파
      socket.to(data.roomId).emit("roleChanged", data);
    });

    // 멤버 제거 이벤트 처리
    socket.on("memberRemoved", (data) => {
      console.log(
        `👤 멤버 제거 이벤트: ${data.email}님이 ${data.removedBy}에 의해 프로젝트에서 제거됨`
      );

      // 같은 방에 있는 다른 모든 클라이언트에게 전파
      socket.to(data.roomId).emit("memberRemoved", data);
    });

    // 연결 해제 처리
    socket.on("disconnect", () => {
      console.log("🔴 사용자 연결 종료:", socket.id);

      for (const roomId in rooms) {
        if (rooms[roomId][socket.id]) {
          const userId = rooms[roomId][socket.id];
          delete rooms[roomId][socket.id];

          // 닉네임 정보 삭제
          if (roomNicknames[roomId] && roomNicknames[roomId][userId]) {
            delete roomNicknames[roomId][userId];
          }

          io.to(roomId).emit("user-disconnected", userId);

          // 닉네임 정보 업데이트 브로드캐스트
          io.to(roomId).emit("sync-nicknames", roomNicknames[roomId]);

          // 사용자의 모드 정보 정리
          if (userModes[roomId] && userModes[roomId][userId]) {
            delete userModes[roomId][userId];

            // 방이 비었으면 모드 정보도 정리
            if (Object.keys(userModes[roomId]).length === 0) {
              delete userModes[roomId];
            }
          }
          // 방이 비었으면 삭제
          if (Object.keys(rooms[roomId]).length === 0) {
            delete rooms[roomId];
            delete roomAudioBuffers[roomId];
            delete roomNicknames[roomId]; // 닉네임 정보도 삭제
            console.log(`Room ${roomId} deleted`);
          }
        }
      }
    });
    // 3D 모드 변경 이벤트 처리
    socket.on("mode-change", ({ roomId, userId, is3DMode }) => {
      console.log(
        `🔄 모드 변경: ${userId}의 3D 모드가 ${
          is3DMode ? "활성화" : "비활성화"
        }됨`
      );

      // 사용자의 모드 상태 저장
      if (!userModes[roomId]) userModes[roomId] = {};
      userModes[roomId][userId] = is3DMode;

      // 다른 사용자들에게 모드 변경 알림
      socket.to(roomId).emit("user-mode-changed", { userId, is3DMode });

      // 3D 모드로 전환 시 커서 자동 숨김 (이중 처리를 위해)
      if (is3DMode) {
        socket.to(roomId).emit("hide-user-cursor", userId);
      }
    });

    // 커서 숨김 이벤트 처리
    socket.on("hide-cursor", ({ roomId, userId }) => {
      console.log(`👆 커서 숨김: ${userId}의 커서가 숨겨짐`);

      // 해당 방의 다른 사용자들에게 이 사용자의 커서를 숨기라고 알림
      socket.to(roomId).emit("hide-user-cursor", userId);
    });

    // 마우스 트래킹 나가기 이벤트 처리
    socket.on("leave-mouse-tracking", ({ roomId, userId }) => {
      console.log(
        `🖱️ 마우스 트래킹 나가기: ${userId}가 ${roomId} 방의 마우스 트래킹을 나감`
      );

      // 같은 방의 다른 사용자들에게 커서 숨김 알림
      socket.to(roomId).emit("hide-user-cursor", userId);
    });
  });
};
