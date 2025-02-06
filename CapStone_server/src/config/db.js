const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "capstone",
});

connection.connect((err) => {
  if (err) {
    console.error("❌ 데이터베이스 연결 오류:", err);
    return;
  }
  console.log("✅ MySQL 데이터베이스에 연결되었습니다");
});

module.exports = connection;
