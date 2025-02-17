// loginHandler.js

const User = require("../models/user");
const activeUsers = {};

module.exports = (socket) => {
  // 로그인 처리
  socket.on("login", async ({ email, password, userId }) => {
    try {
      // 이메일과 비밀번호로 유저 인증 (데이터베이스 호출)
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return socket.emit("login_error", {
          message: "존재하지 않는 이메일입니다.",
        });
      }

      // 비밀번호 확인
      if (password !== user.user_password) {
        return socket.emit("login_error", {
          message: "비밀번호가 일치하지 않습니다.",
        });
      }

      // 로그인 성공 시 유저 정보 저장
      activeUsers[userId] = socket.id;
      socket.emit("login_success", { message: "로그인 성공!" });
      console.log(`User ${userId} logged in with socket id ${socket.id}`);
    } catch (error) {
      socket.emit("login_error", {
        message: "로그인 처리 중 오류가 발생했습니다.",
      });
    }
  });

  // 로그아웃 처리
  socket.on("logout", ({ userId }) => {
    if (activeUsers[userId]) {
      delete activeUsers[userId]; // 유저 로그아웃 시 activeUsers에서 제거
      console.log(`User ${userId} logged out`);
      socket.emit("logout_success", { message: "로그아웃 성공!" });
    }
  });

  // 로그인한 유저 목록 확인
  socket.on("get-active-users", () => {
    socket.emit("active-users", { users: Object.keys(activeUsers) });
  });
};
