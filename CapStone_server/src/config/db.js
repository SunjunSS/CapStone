const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "database-capstone.cxw71dyvtgd2.ap-northeast-2.rds.amazonaws.com",
  user: "root",
  password: "00000000",
  database: "capstone",
  port: 3306,
});

connection.connect((err) => {
  if (err) {
    console.error("❌ 데이터베이스 연결 오류:", err);
    return;
  }
  console.log("✅ MySQL 데이터베이스에 연결되었습니다");
});

module.exports = connection;
