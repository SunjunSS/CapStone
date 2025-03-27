const mailService = require("../services/mailService/mailService");

// 인증 코드 전송
const sendAuthCode = async (req, res) => {
  const { email } = req.body;
  try {
    await mailService.sendAuthCodeEmail(email);
    res.json({ message: "인증 코드 전송됨" });
  } catch (err) {
    res.status(500).json({ message: "이메일 전송 실패" });
  }
};

// 인증 코드 확인
const verifyAuthCode = (req, res) => {
  const { email, code } = req.body;
  const result = mailService.verifyAuthCodeAndLogin(email, code);
  if (!result.valid) {
    return res.status(400).json({ message: result.message });
  }
  res.json({ message: "인증 성공" });
};

// 초대 이메일 전송
const sendInvitation = async (req, res) => {
  const { email, projectId } = req.body;
  try {
    await mailService.sendInvitationEmail(email, projectId);
    res.json({ message: "초대 메일 전송됨" });
  } catch (err) {
    res.status(500).json({ message: "초대 이메일 전송 실패" });
  }
};

module.exports = {
  sendAuthCode,
  verifyAuthCode,
  sendInvitation,
};
