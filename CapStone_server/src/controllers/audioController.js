const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
const {
  convertToMP3,
  processAudioFile,
  mixAndConvertAudio,
} = require("../services/audioService/audioService");

const roomAudioBuffers = {}; // 각 방의 오디오 파일 저장
const roomEvents = {}; // 방별 이벤트 관리

module.exports = (io) => {
  return {
    /**
     * 음성 파일 업로드 및 처리
     */
    uploadAudio: async (req, res, mode) => {
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

        if (mode === "realTime") {
          // ✅ 실시간 모드: 변환 후 실시간 API 호출
          const mp3Path = await convertToMP3(inputPath);
          console.log(`✅ 실시간 MP3 변환 성공: ${mp3Path}`);

          const realTimeResponse = await processRealTimeAudio(mp3Path);

          io.to(roomId).emit("real-time-analysis", { realTimeResponse });

          return res.send({
            message: "✅ 실시간 분석 완료!",
            realTimeResponse,
          });
        }

        // ✅ Socket.io의 방 정보에서 참여자 수 확인
        const roomSockets = io.sockets.adapter.rooms.get(roomId); // 현재 방의 참여자 목록
        const expectedUsers = roomSockets ? roomSockets.size : 1; // 참여자 수 확인
        console.log(`👥 방(${roomId}) 예상 참여자: ${expectedUsers}명`);

        // 방별 오디오 저장 배열 추가
        if (!roomAudioBuffers[roomId]) {
          roomAudioBuffers[roomId] = [];
        }
        roomAudioBuffers[roomId].push(inputPath);
        const roomSize = roomAudioBuffers[roomId].length;

        console.log(`📌 현재 방(${roomId}) 오디오 파일 개수: ${roomSize}`);

        // ✅ 모든 참여자의 파일이 도착할 때까지 기다리는 Promise 생성
        if (!roomEvents[roomId]) {
          roomEvents[roomId] = new EventEmitter();
        }

        // 모든 참여자가 파일을 업로드할 때까지 대기
        await new Promise((resolve) => {
          if (roomSize === expectedUsers) {
            resolve(); // 모든 파일이 업로드되었으면 바로 처리 시작
          } else {
            console.log(
              `⏳ ${roomSize}/${expectedUsers}개 파일 업로드됨. 대기 중...`
            );
            roomEvents[roomId].once("allUploaded", resolve);
          }
        });

        // 🎶 모든 참여자의 파일이 도착했으므로 믹싱 및 MP3 변환 실행
        console.log(
          `🎶 ${expectedUsers}명 모두 업로드 완료 - 오디오 믹싱 실행`
        );
        const mp3Path = await mixAndConvertAudio(roomId, roomAudioBuffers);
        console.log(`✅ 믹싱 및 MP3 변환 성공: ${mp3Path}`);

        const { clovaResponse, openAIResponse } = await processAudioFile(
          mp3Path
        );

       
        io.to(roomId).emit("return-recording", {
          openAIResponse,
        });

        // 처리 후 해당 방의 업로드 리스트 초기화
        delete roomAudioBuffers[roomId];
        delete roomEvents[roomId];

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
