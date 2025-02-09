const fs = require("fs");
const path = require("path");
const {
  convertToMP3,
  processAudioFile,
} = require("../services/audioService/audioService");

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

    // ✅ MP3 변환 실행
    const mp3Path = await convertToMP3(inputPath);
    console.log(`✅ MP3 변환 성공: ${mp3Path}`);

    const { clovaResponse } = await processAudioFile(mp3Path);

    res.send({ message: "✅ 업로드 및 처리 완료!", clovaResponse });
  } catch (error) {
    console.error("❌ 업로드 처리 오류:", error);
    res.status(500).send({ message: "Error processing file." });
  }
};
