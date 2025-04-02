const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 파일 저장 경로 설정
const baseTempAudioFolder = path.join(__dirname, "../../storage/temp_audio");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { roomId, type } = req.body; // 요청에서 roomId와 type(RealTime or Meeting) 추출

    if (!roomId) {
      return cb(new Error("roomId가 필요합니다."), null);
    }

    // 요청 타입에 따라 저장 폴더 경로 설정
    const folderType = type === "realTime" ? "realTime" : "meeting";
    const roomFolderPath = path.join(baseTempAudioFolder, folderType, roomId);

    // 폴더가 없으면 생성
    if (!fs.existsSync(roomFolderPath)) {
      fs.mkdirSync(roomFolderPath, { recursive: true });
    }

    cb(null, roomFolderPath);
  },

  filename: (req, file, cb) => {

    const { nickname, roomId } = req.body;

    if (!nickname || !roomId) {
      return cb(new Error("닉네임과 roomId가 필요합니다."), null);
    }

    // 파일명: nickname_roomId.mp3 형식으로 저장
    const fileName = `${nickname}_${roomId}.mp3`;
    req.fileName = fileName;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

module.exports = { upload };
