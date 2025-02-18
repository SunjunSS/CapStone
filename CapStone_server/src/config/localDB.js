const { Sequelize } = require("sequelize");
require("dotenv").config(); // 환경 변수 불러오기

const sequelize = new Sequelize(
  process.env.DB_NAME, // DB 이름
  process.env.DB_USER, // DB 사용자명
  process.env.DB_PASSWORD, // DB 비밀번호
  {
    host: process.env.DB_HOST, // DB 호스트
    dialect: "mysql", // MySQL을 사용
    port: process.env.DB_PORT, // 포트
  }
);

// DB 연결 테스트
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ MySQL 데이터베이스 연결 성공(local sequelize)");
  })
  .catch((err) => {
    console.error("❌ MySQL 데이터베이스 연결 실패:", err);
  });

module.exports = sequelize;
