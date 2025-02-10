const fs = require("fs");
const path = require("path");
const {
  convertToMP3,
  processAudioFile,
} = require("../services/audioService/audioService");
const roomAudioBuffers = {};


exports.uploadAudio = async (req, res) => {
  try {
    if (!req.file || !req.body.roomId) {
      return res
        .status(400)
        .send({ message: "❌ Missing audio file or roomId" });
    }

    const roomId = req.body.roomId;
    const inputPath = req.file.path; // ✅ multer가 자동으로 저장한 파일 경로 사용

    console.log(`🎤 파일 저장 완료: ${inputPath}`);

    // ✅ 파일이 정상적으로 존재하는지 확인
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ 입력 파일이 존재하지 않습니다: ${inputPath}`);
      return res.status(500).send({ message: "Error: Input file not found" });
    }

    // 방에 저장된 오디오 파일 리스트에 추가
    if (!roomAudioBuffers[roomId]) {
      roomAudioBuffers[roomId] = [];
    }
    roomAudioBuffers[roomId].push(inputPath);

    const roomSize = roomAudioBuffers[roomId].length; // 현재 업로드된 파일 개수

    console.log(`📌 현재 방(${roomId}) 오디오 파일 개수: ${roomSize}`);

    if (roomSize === 1) {
      // 🎤 1명일 경우 바로 변환
      console.log("👤 1명 참여 - 단일 파일 MP3 변환 실행");
      const mp3Path = await convertToMP3(inputPath);
      console.log(`✅ MP3 변환 성공: ${mp3Path}`);

      const { clovaResponse } = await processAudioFile(mp3Path);

      return res.send({
        message: "✅ 업로드 및 처리 완료!",
        clovaResponse,
      });
    } else {
      // 👥 2명 이상일 경우 -> 참여자 수와 업로드된 파일 개수가 동일해야 처리
      const expectedUsers = req.body.participants; // 요청 본문에서 예상 참여자 수 받아오기

      if (roomSize === expectedUsers) {
        console.log(
          `🎶 ${expectedUsers}명 모두 업로드 완료 - 오디오 믹싱 실행`
        );
        const mp3Path = await mixAndConvertAudio(roomId, roomAudioBuffers);
        console.log(`✅ 믹싱 및 MP3 변환 성공: ${mp3Path}`);

        const { clovaResponse } = await processAudioFile(mp3Path);

        // 처리 후 해당 방의 업로드 리스트 초기화
        delete roomAudioBuffers[roomId];

        return res.send({
          message: "✅ 믹싱 및 처리 완료!",
          clovaResponse,
        });
      } else {
        console.log(
          `⏳ 현재 ${roomSize}/${expectedUsers}개 파일 업로드됨. 대기 중...`
        );
        return res
          .status(202)
          .send({ message: "⏳ 모든 파일이 업로드될 때까지 대기해주세요." });
      }
    }
  } catch (error) {
    console.error("❌ 업로드 처리 오류:", error);
    res.status(500).send({ message: "Error processing file." });
  }
};
