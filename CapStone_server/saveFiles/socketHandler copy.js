const loginHandler = require("./LoginHandler.js");
const nodeService = require("../services/nodeService/nodeService"); // ✅ nodeService 추가
const audioHandler = require("./audioHandler.js")

const rooms = {};
const roomAudioBuffers = {};
const recordingStatus = {};
const socketSessions = require("./socketSessions");
const roomNodes = {}; // 노드 저장 객체 추가 (누락되어 있었음)
const roomNicknames = {}; // 방별 닉네임 정보 저장 객체 추가
const roomTranscripts = {};




module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 사용자 연결됨:", socket.id);

    let nowRoomId = null;
    // 로그인 핸들러 실행
    loginHandler(socket);

    //  RTC 오디오 관리 핸들러 실행
    // audioHandler(socket);
    const { SpeechClient } = require("@google-cloud/speech");
    process.env.GOOGLE_APPLICATION_CREDENTIALS =
      "../google_key/planar-lacing-454709-b6-06cea798e131.json";

    // 실시간 googleSTT 이벤트 시작
    const client = new SpeechClient();
    const encoding = "WEBM_OPUS";
    const sampleRateHertz = 16000;
    const languageCode = "ko-KR";

    const request = {
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
      },
      single_utterance: false,
      interimResults: true, // 중간 결과 반환
    };

    // Keep-Alive 처리: 일정 간격으로 빈 데이터 전송
    const keepAliveInterval = setInterval(() => {
      if (!recognizeStream.destroyed) {
        recognizeStream.write(Buffer.from([])); // 빈 버퍼 전송
      }
    }, 5000); // 5초마다 전송

    // Google STT 스트림 생성
    const recognizeStream = client
      .streamingRecognize(request)
      .on("error", console.error)
      .on("data", (data) => {
        const transcript = data.results[0]?.alternatives[0]?.transcript;

        if (transcript) {
          console.log(`STT: ${transcript}`);

          // 해당 방에 텍스트 추가
          roomTranscripts[nowRoomId].transcripts.push(transcript);
          roomTranscripts[nowRoomId].count += 1;

          // 해당 room의 텍스트가 모두 모였을 경우
          if (roomTranscripts[nowRoomId].count === rooms[nowRoomId].length) {
            // AI한테 보내기
            console.log(`${nowRoomId}의 10초마다 AI분석 시행`)
            //processRoomData(nowRoomId);
          }
        }
      });

    let audioBufferQueue = [];

    const sendAudioDataInterval = setInterval(() => {
      if (audioBufferQueue.length > 0) {
        const concatenatedBuffer = Buffer.concat(audioBufferQueue);
        if (!recognizeStream.destroyed) {
          recognizeStream.write(concatenatedBuffer); // 10초마다 데이터를 보내기
          console.log("STT에 데이터 전송:", concatenatedBuffer.length);
        }
        audioBufferQueue = []; // 전송 후 큐 초기화
      }
    }, 10000); // 10초마다 전송

    // 음성 데이터 수신 처리
    socket.on("streamingData", (audioBuffer) => {
      if (!audioBuffer || !(audioBuffer instanceof Uint8Array)) {
        console.error("❌ Received invalid audioBuffer:", audioBuffer);
        return;
      }

      const buffer = Buffer.from(audioBuffer);
      audioBufferQueue.push(buffer);
    });

    

    // 방 참가 처리
    socket.on("join-room", ({ roomId, userId, nickname }) => {
      socket.join(roomId);
      nowRoomId = roomId

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

      if(!roomTranscripts[roomId]) {
        // 음성 텍스트를 저장
        roomTranscripts[roomId] = { transcripts: [], count: 0 };
      }

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
      recordingStatus[roomId] = true;
      io.to(roomId).emit("sync-recording", true);
      console.log(`📡 sync-recording 이벤트 전송 - Room ID: ${roomId}`);
      roomAudioBuffers[roomId] = [];

      

    });

    // 녹음 중지 처리
    socket.on("stop-recording", (roomId) => {
      console.log(`Recording stopped in room ${roomId}`);

      // googleSTT도 종료
      console.log("🚪 클라이언트 연결 해제, STT 스트림 종료");
      // clearInterval(keepAliveInterval); // Keep-Alive 중지
      // clearInterval(sendAudioDataInterval);
      // recognizeStream.end();

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
  });
};
