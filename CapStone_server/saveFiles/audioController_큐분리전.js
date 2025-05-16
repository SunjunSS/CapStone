const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
const {
  processAudioFile,
  mixAndConvertAudio,
  processIndividualFile,
} = require("../services/audioService/audioService");

const meetingAudioBuffers = {}; // 각 방의 오디오 파일 저장
const meetingEvents = {}; // 방별 이벤트 관리

const realTimeAudioBuffers = {}; // 각 방의 오디오 파일 저장
const realTimeEvents = {}; // 방별 이벤트 관리

const userSpeech = {};

module.exports = (io) => {
  return {
    uploadMeetingAudio: async (req, res) => {
      try {
        if (!req.file || !req.body.roomId) {
          return res
            .status(400)
            .send({ message: "❌ Missing audio file or roomId" });
        }

        const roomId = req.body.roomId;
        const nickname = req.body.nickname;
        const inputPath = req.file.path;

        console.log(`🎤 파일 저장 완료: ${inputPath}`);

        if (!fs.existsSync(inputPath)) {
          console.error(`❌ 입력 파일이 존재하지 않습니다: ${inputPath}`);
          return res
            .status(500)
            .send({ message: "Error: Input file not found" });
        }

        // ✅ Socket.io의 방 정보에서 참여자 수 확인
        const roomSockets = io.sockets.adapter.rooms.get(roomId); // 현재 방의 참여자 목록
        const expectedUsers = roomSockets ? roomSockets.size : 1; // 참여자 수 확인
        console.log(`👥 방(${roomId}) 참여자: ${expectedUsers}명`);

        // 방별 오디오 저장 배열 추가
        if (!meetingAudioBuffers[roomId]) {
          meetingAudioBuffers[roomId] = [];
          userSpeech[roomId] = [];
        }

        // 객체 형태로 {닉네임, mp3파일}객체를 전달해줌
        meetingAudioBuffers[roomId].push({ nickname, inputPath });
        const roomSize = meetingAudioBuffers[roomId].length;

        console.log(
          `📌 현재 방(${roomId}) 회의록 오디오 파일 개수: ${roomSize}`
        );

        // ✅ 모든 참여자의 파일이 도착할 때까지 기다리는 Promise 생성
        if (!meetingEvents[roomId]) {
          meetingEvents[roomId] = new EventEmitter();
        }

        // 모든 참여자가 파일을 업로드할 때까지 대기
        await new Promise((resolve) => {
          if (roomSize === expectedUsers) {
            resolve(); // 모든 파일이 업로드되었으면 바로 처리 시작
          } else {
            console.log(
              `⏳ ${roomSize}/${expectedUsers}개 파일 업로드됨. 대기 중...`
            );
            meetingEvents[roomId].once("allUploaded", resolve);
          }
        });

        // 🎶 모든 참여자의 파일이 도착했으므로 믹싱 및 MP3 변환 실행
        console.log(`🎶 ${expectedUsers}명 모두 업로드 완료`);

        const { openAIResponse, mixedAudioPath } = await processIndividualFile(
          meetingAudioBuffers[roomId],
          roomId,
          false
        );

        if (openAIResponse == null) {
          console.log("audioController: ai응답이 비었습니다.");
        }
        console.log("🔹 OpenAI 응답 타입:", typeof openAIResponse);

        const mp3Buffer = fs.readFileSync(mixedAudioPath);

        io.to(roomId).emit("return-recording", {
          recordingData: openAIResponse,
          fileBuffer: mp3Buffer.toString("base64"),
        });

        // 처리 후 해당 방의 업로드 리스트 초기화
        delete meetingAudioBuffers[roomId];
        delete meetingEvents[roomId];

        return res.send({
          message: "✅ 믹싱 및 처리 완료!",
        });
      } catch (error) {

        console.error("❌ 업로드 처리 오류:", error);
        delete meetingAudioBuffers[roomId];
        delete meetingEvents[roomId];
        res.status(500).send({ message: "Error processing file." });
        
      }
    },

    uploadRealTimeAudio: async (req, res) => {
      try {
        if (!req.file || !req.body.roomId) {
          return res
            .status(400)
            .send({ message: "❌ Missing audio file or roomId" });
        }

        const roomId = req.body.roomId;
        const nickname = req.body.nickname;
        const inputPath = req.file.path;

        console.log(`🎤 파일 저장 완료: ${inputPath}`);

        if (!fs.existsSync(inputPath)) {
          console.error(`❌ 입력 파일이 존재하지 않습니다: ${inputPath}`);
          return res
            .status(500)
            .send({ message: "Error: Input file not found" });
        }

        // ✅ Socket.io의 방 정보에서 참여자 수 확인
        const roomSockets = io.sockets.adapter.rooms.get(roomId); // 현재 방의 참여자 목록
        const expectedUsers = roomSockets ? roomSockets.size : 1; // 참여자 수 확인
        console.log(`👥 방(${roomId}) 참여자: ${expectedUsers}명`);

        // 방별 오디오 저장 배열 추가
        if (!realTimeAudioBuffers[roomId]) {
          realTimeAudioBuffers[roomId] = [];
          userSpeech[roomId] = [];
        }

        // 객체 형태로 {닉네임, mp3파일}객체를 전달해줌
        realTimeAudioBuffers[roomId].push({ nickname, inputPath });
        const roomSize = realTimeAudioBuffers[roomId].length;

        console.log(
          `📌 현재 방(${roomId}) 실시간 오디오 파일 개수: ${roomSize}`
        );

        // ✅ 모든 참여자의 파일이 도착할 때까지 기다리는 Promise 생성
        if (!realTimeEvents[roomId]) {
          realTimeEvents[roomId] = new EventEmitter();
        }

        // 모든 참여자가 파일을 업로드할 때까지 대기
        await new Promise((resolve) => {
          if (roomSize === expectedUsers) {
            resolve(); // 모든 파일이 업로드되었으면 바로 처리 시작
          } else {
            console.log(
              `⏳ ${roomSize}/${expectedUsers}개 파일 업로드됨. 대기 중...`
            );
            realTimeEvents[roomId].once("allUploaded", resolve);
          }
        });

        // 🎶 모든 참여자의 파일이 도착했으므로 믹싱 및 MP3 변환 실행
        console.log(`🎶 ${expectedUsers}명 모두 업로드 완료`);

        const { openAIResponse, mixedAudioPath, addedNodes } =
          await processIndividualFile(
            realTimeAudioBuffers[roomId],
            roomId,
            true
          );

        if (openAIResponse == null) {
          console.log("audioController: ai응답이 비었습니다.");
        }
        console.log("🔹 OpenAI 응답 타입:", typeof openAIResponse);

        // 노드 추가 소켓 전송은 여기서 그대로 유지
        if (addedNodes && addedNodes.nodes && addedNodes.nodes.length > 0) {
          const projectId = roomId.split("-").pop();
          const projectRoomId = `project-${projectId}`;

          io.to(projectRoomId).emit("nodeAdded", addedNodes.nodes);
        }

        io.to(roomId).emit("return-keyword", {
          recordingData: openAIResponse,
        });

        // 처리 후 해당 방의 업로드 리스트 초기화
        delete realTimeAudioBuffers[roomId];
        delete realTimeEvents[roomId];

        return res.send({
          message: "✅ 믹싱 및 처리 완료!",
        });
      } catch (error) {
        console.error("❌ 업로드 처리 오류:", error);
        res.status(500).send({ message: "Error processing file." });
      }
    },
  };
};
