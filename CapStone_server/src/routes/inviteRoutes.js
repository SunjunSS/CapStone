// routes/inviteRoutes.js
const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // .env에 저장된 이메일 주소
    pass: process.env.EMAIL_PASS, // 앱 비밀번호
  },
});

// 초대 이메일 발송 API
router.post("/", async (req, res) => {
  const { email, projectId } = req.body;

  if (!email || !projectId) {
    return res
      .status(400)
      .json({ message: "이메일과 프로젝트 ID가 필요합니다." });
  }

  // 초대 링크 생성 (예: 프로젝트 초대 URL)
  const inviteLink = `http://localhost:5173/invite/accept?email=${encodeURIComponent(
    email
  )}&projectId=${projectId}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "프로젝트에 초대되었습니다",
    html: `
      <p>당신은 프로젝트에 초대되었습니다.</p>
      <p>아래 링크를 클릭하여 참여하세요:</p>
      <a href="${inviteLink}">${inviteLink}</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "초대 이메일이 전송되었습니다." });
  } catch (err) {
    console.error("이메일 전송 오류:", err);
    res.status(500).json({ message: "이메일 전송에 실패했습니다." });
  }
});

module.exports = router;
