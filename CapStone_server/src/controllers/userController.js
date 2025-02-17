const { registerUser, loginUser } = require("../service/userService");

// 🟢 회원가입 컨트롤러
exports.register = async (req, res) => {
  try {
    const { email, user_password } = req.body;
    const newUser = await registerUser(email, user_password);
    res.status(201).json({ message: "회원가입 성공!", user: newUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔵 로그인 컨트롤러
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);
    res.json({ message: "로그인 성공!", user });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
