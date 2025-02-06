// audio 임시, 영구 저장 경로
const path = require("path");
const multer = require("multer");  // multer 패키지 사용
const save = path.join(__dirname, "storage", "temp_audio");

// multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, save); // 업로드할 폴더 경로
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 파일 이름 설정
  },
});

const upload = multer({ storage: storage });

module.exports = upload;