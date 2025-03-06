const dotenv = require("dotenv");
const path = require("path");

// ✅ .env 파일 로드
dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    port: process.env.DB_PORT,
  },
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    clova: process.env.CLOVA_API_KEY,
    kakaoMap: process.env.KAKAO_MAP_API_KEY,
  },
};
