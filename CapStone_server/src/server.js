const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { initDB } = require("./models");

const app = express();
// const server = http.createServer(app);
const server = require("http").createServer(
  {
    maxConnections: 1000,
    headersTimeout: 60000,
    keepAliveTimeout: 60000,
  },
  app
);


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// ✅ 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅  Register 라우트 설정
const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes); // ✅ user API 사용

// ✅  Project 라우트 설정
const projectRoutes = require("./routes/projectRoutes");
app.use("/api/project", projectRoutes);

// ✅ MindMap 라우트 설정
const nodeRoutes = require("./routes/nodeRoutes")(io); // io 전달
app.use("/api/mindmap", nodeRoutes);

// ✅ Audio 라우트 설정
const audioRoutes = require("./routes/audioRoutes")(io); // ✅ io를 전달
app.use("/api/audio", audioRoutes); // ✅ io를 전달한 라우터 사용

// ✅ WebSocket 연결 관리
require("./socket/socketHandler")(io);

// ✅ bestIdea 라우터 설정
const bestIdeaRoutes = require("./routes/bestIdeaRoutes");
app.use("/api/best-ideas", bestIdeaRoutes);

// // 초대 라우트 등록
// const inviteRoutes = require("./routes/inviteRoutes");
// app.use("/api/invite", inviteRoutes);

// const authRoutes = require("./routes/authRoutes");
// app.use("/api/auth", authRoutes);

const mailRoutes = require("./routes/mailRoutes");
app.use("/api/mail", mailRoutes);

// ✅ 정적 파일 전송 관리
app.use(
  "/static/audio",
  express.static(path.join(__dirname, "../storage/audio"))
);

// ✅ 서버 시작 전에 데이터베이스 동기화 수행
initDB();

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
