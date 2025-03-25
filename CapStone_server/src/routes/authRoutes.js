// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// 간단한 메모리 저장소 (배포 시 Redis 또는 DB 권장)
const authCodes = new Map();

/** 📩 이메일로 인증 코드 전송 */
router.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "이메일이 필요합니다." });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5분 유효

  authCodes.set(email, { code, expiresAt });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "로그인 인증 코드",
      html: `<h3>인증 코드: ${code}</h3><p>5분 내에 입력해 주세요.</p>`,
    });

    res.json({ message: "인증 코드 전송됨" });
  } catch (err) {
    console.error("이메일 전송 실패:", err);
    res.status(500).json({ message: "이메일 전송에 실패했습니다." });
  }
});

/** ✅ 인증 코드 검증 */
router.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  const saved = authCodes.get(email);

  if (!saved) {
    return res
      .status(400)
      .json({ message: "해당 이메일로 요청된 인증 코드가 없습니다." });
  }

  if (Date.now() > saved.expiresAt) {
    authCodes.delete(email);
    return res.status(400).json({ message: "인증 코드가 만료되었습니다." });
  }

  if (saved.code !== code) {
    return res.status(400).json({ message: "인증 코드가 올바르지 않습니다." });
  }

  authCodes.delete(email); // 인증 완료 시 제거
  res.json({ message: "인증 성공" });
});

module.exports = router;
