// services/authCodeService.js
const authCodes = new Map();

const generateCode = (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  authCodes.set(email, { code, expiresAt });
  return code;
};

const validateCode = (email, inputCode) => {
  const saved = authCodes.get(email);
  if (!saved) return { valid: false, reason: "no_request" };
  if (Date.now() > saved.expiresAt) {
    authCodes.delete(email);
    return { valid: false, reason: "expired" };
  }
  if (saved.code !== inputCode) return { valid: false, reason: "mismatch" };

  authCodes.delete(email);
  return { valid: true };
};

module.exports = { generateCode, validateCode };
