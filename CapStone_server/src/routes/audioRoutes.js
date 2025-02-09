const express = require("express");
const { upload } = require("../config/multerConfig"); // ✅ multerConfig.js에서 불러오기
const { uploadAudio } = require("../controllers/audioController");

const router = express.Router();

// ✅ POST 요청을 통해 음성 파일 업로드 처리
router.post("/upload", upload.single("audio"), uploadAudio);

module.exports = router;
