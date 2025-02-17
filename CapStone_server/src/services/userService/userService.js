const User = require("../models/user");

// 🟢 회원가입 서비스 함수
exports.registerUser = async (email, user_password) => {
  // 이메일 중복 확인
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  // 새로운 사용자 생성
  const newUser = await User.create({ email, user_password });
  return newUser;
};

// 🔵 로그인 서비스 함수
exports.loginUser = async (email, password) => {
  // 유저 확인
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("존재하지 않는 이메일입니다.");
  }

  // 비밀번호 확인 (단순 비교)
  if (password !== user.user_password) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }

  return user;
};
