// userRepository.js
const { User } = require("../../models");

exports.registerUser = async (name, email, password) => {
  // 도메인 제한 검사
  const allowedDomains = ["gmail.com", "naver.com"];
  const emailDomain = email.split("@")[1];
  if (!allowedDomains.includes(emailDomain)) {
    throw new Error("gmail.com 또는 naver.com 이메일만 가입할 수 있습니다.");
  }

  // 중복 검사
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  // 사용자 생성
  const newUser = await User.create({ name, email, password });

  return {
    message: "회원가입이 성공적으로 완료되었습니다.",
    user: { name, email },
  };
};
