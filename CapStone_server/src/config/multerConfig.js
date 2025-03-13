const multer = require("multer");
const path = require("path");

// 파일 저장 경로 설정
const tempAudioFolder = path.join(__dirname, "../../storage/temp_audio");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempAudioFolder);
  },
  filename: (req, file, cb) => {
    // 닉네임 가져오기 (닉네임이 없으면 timestamp 사용)
    const nickname = req.body.nickname
    const roomId = req.body.roomId
    
    console.log(`닉네임: ${nickname}`);

    // 파일명: nickname_roomId.mp3 형식으로 저장
    const fileName = `${nickname}_${roomId}.mp3`;
    req.fileName = fileName;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

module.exports = { upload };
