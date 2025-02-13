const mysql = require("mysql2");
require("dotenv").config(); // .env 파일을 불러오기

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  if (err) {
    console.error("❌ 데이터베이스 연결 오류:", err);
    return;
  }
  console.log("✅ MySQL 데이터베이스에 연결되었습니다");
});

module.exports = connection;
