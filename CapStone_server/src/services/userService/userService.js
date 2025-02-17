const User = require("../../models/user");

// 🟢 회원가입 서비스 함수
exports.registerUser = async (name, email, user_password) => {
  // 이메일 중복 확인
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  // 새로운 사용자 생성
  const newUser = await User.create({ name, email, user_password });

   // 성공 메시지와 유저의 이름, 이메일 반환
  return {
    message: "회원가입이 성공적으로 완료되었습니다.",
    user: {
      name,
      email,
    },
  }
};

