const multer = require("multer");
const path = require("path");

// 파일 저장 경로 설정
const tempAudioFolder = path.join(__dirname, "../../storage/temp_audio");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempAudioFolder);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}${path.extname(file.originalname)}`;
    req.fileName = fileName;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

module.exports = { upload };
