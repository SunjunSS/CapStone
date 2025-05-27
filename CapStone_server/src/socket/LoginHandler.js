const User = require("../models/users");

const activeUsers = {};
const socketSessions = require("./socketSessions");

module.exports = (socket) => {
  console.log("🟢 LoginHandler initialized for", socket.id);

  // 기존 로그인 소켓 리스너 정리
  socket.removeAllListeners("login");

  let isLoggedIn = false; // 로그인 상태를 추적할 변수

  // 로그인 처리
  socket.on("login", async ({ email, password }) => {
    if (isLoggedIn) {
      console.log("❌ 이미 로그인 된 사용자입니다.");
      return socket.emit("login_error", {
        message: "이미 로그인 되어 있습니다.",
      });
    }

    try {
      const user = await User.findOne({ where: { email } });

      // user가 null인 경우 먼저 체크
      if (!user) {
        return socket.emit("login_error", {
          message: "존재하지 않는 이메일입니다.",
        });
      }

      if (password !== user.password) {
        return socket.emit("login_error", {
          message: "비밀번호가 일치하지 않습니다.",
        });
      }

      // 나머지 로그인 성공 로직은 동일
      const userId = user.user_id;
      socketSessions[userId] = socket.id;
      console.log(`🟢 ${email} logged in with socket ID: ${socket.id}`);

      activeUsers[userId] = email;
      isLoggedIn = true;

      socket.emit("login_success", { user: user, message: "로그인 성공!" });
      console.log(`✅ User ${email} logged in`);
    } catch (error) {
      // 이제 진정한 데이터베이스 오류만 여기서 처리됩니다.
      console.error("데이터베이스 오류:", error);
      socket.emit("login_error", {
        message: "로그인 처리 중 오류가 발생했습니다.",
      });
    }
  });

  // 로그아웃 처리 (해당 유저의 user.user_id가 전달돼야 함)
  socket.on("logout", ({ userId }) => {
    if (activeUsers[userId]) {
      delete socketSessions[userId];
      delete activeUsers[userId];

      isLoggedIn = false; // 로그아웃 시 로그인 상태 해제

      console.log(`❌ User ${userId} logged out`);
      socket.emit("logout_success", { message: "로그아웃 성공!" });
    } else {
      socket.emit("logout_error", { message: "로그인된 상태가 아닙니다." });
    }
  });

  // 현재 로그인한 유저 목록 조회
  socket.on("get-active-users", () => {
    socket.emit("active-users", { users: Object.keys(activeUsers) });
  });

  // 소켓 연결 해제 처리
  socket.on("disconnect", () => {
    console.log("🔴 사용자 연결 종료:", socket.id);

    // 사용자 세션 종료 시 처리
    for (const userId in socketSessions) {
      if (socketSessions[userId] === socket.id) {
        delete socketSessions[userId];
        delete activeUsers[userId];
        console.log(`❌ User ${userId} session ended`);
      }
    }
  });
};
