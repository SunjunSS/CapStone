const { registerUser } = require("../services/userService");

// 🟢 회원가입 컨트롤러
exports.register = async (req, res) => {
  try {
    const { name, email, user_password } = req.body;
    console.log(`회원 이름: ${name}`);
    const newUser = await registerUser(name, email, user_password);
    res.status(201).json({ message: "회원가입 성공!", user: newUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


