const express = require("express");
const { upload } = require("../config/multerConfig");
const audioController = require("../controllers/audioController");

module.exports = (io) => {
  const router = express.Router();
  const { uploadMeetingAudio, uploadRealTimeAudio } = audioController(io);

  // 올바른 미들웨어 체인 구성
  router.post(
    "/meeting",
    upload.single("audio"),
    (req, res, next) => {
      next(); // 다음 미들웨어로 제어 전달
    },
    uploadMeetingAudio // 함수 참조만 전달, 즉시 호출하지 않음
  );

  router.post(
    "/realTime",
    upload.single("audio"),
    (req, res, next) => {
      next(); // 다음 미들웨어로 제어 전달
    },
    uploadRealTimeAudio // 함수 참조만 전달, 즉시 호출하지 않음
  );

  return router;
};
