const User = require("../models/User"); // ✅ User 모델을 가져옴

exports.register = async (req, res) => {
  try {
    const { user_name, email, user_password, user_birthdate } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "이미 가입된 이메일입니다." });
    }

    // 새로운 사용자 생성 (비밀번호 암호화 없음)
    const newUser = new User({
      user_name,
      email,
      user_password,
      user_birthdate,
    });

    await newUser.save();
    res.status(201).json({ message: "회원가입 성공!" });
  } catch (error) {
    res.status(500).json({ message: "회원가입 중 오류 발생" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 유저 확인
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "존재하지 않는 이메일입니다." });
    }

    // 비밀번호 확인 (단순 비교)
    if (password !== user.user_password) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    res.json({ message: "로그인 성공!" });
  } catch (error) {
    res.status(500).json({ message: "로그인 중 오류 발생" });
  }
};
