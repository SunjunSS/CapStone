const express = require("express");
const { upload } = require("../config/multerConfig"); // ✅ multerConfig.js에서 불러오기
const audioController = require("../controllers/audioController");

const router = express.Router();

module.exports = (io) => {
  const router = express.Router();
  const { uploadAudio } = audioController(io);

  // ✅ 회의록 업로드 (일반 모드)
  router.post("/upload", upload.single("audio"), (req, res) =>
    uploadAudio(req, res, "upload")
  );

  // ✅ 실시간 업로드
  router.post("/realTime", upload.single("audio"), (req, res) =>
    uploadAudio(req, res, "realTime")
  );

  return router;
};
