const { Sequelize } = require("sequelize");
// require("dotenv").config(); // 환경 변수 불러오기

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

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

module.exports = sequelize;
