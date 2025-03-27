// services/mailService.js
const { sendMail } = require("./mailer");
const { generateCode, validateCode } = require("./authCodeService");

// 인증 코드 메일 전송
const sendAuthCodeEmail = async (email) => {
  const code = generateCode(email);
  await sendMail({
    to: email,
    subject: "로그인 인증 코드",
    html: `<h3>인증 코드: ${code}</h3><p>5분 내에 입력해 주세요.</p>`,
  });
};

// 인증 코드 확인
const verifyAuthCodeAndLogin = (email, code) => {
  const result = validateCode(email, code);
  if (!result.valid) {
    const messages = {
      no_request: "요청된 코드가 없습니다.",
      expired: "인증 코드가 만료되었습니다.",
      mismatch: "인증 코드가 올바르지 않습니다.",
    };
    return { valid: false, message: messages[result.reason] };
  }
  return { valid: true };
};

// 초대 메일 전송
const sendInvitationEmail = async (email, projectId) => {
  const link = `http://localhost:5276/MindMap/${projectId}`;
  await sendMail({
    to: email,
    subject: "프로젝트에 초대되었습니다",
    html: `<p>당신은 프로젝트에 초대되었습니다.</p><p><a href="${link}">${link}</a></p>`,
  });
};

module.exports = {
  sendAuthCodeEmail,
  verifyAuthCodeAndLogin,
  sendInvitationEmail,
};
