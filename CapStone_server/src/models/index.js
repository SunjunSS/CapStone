const sequelize = require("../config/db");
const User = require("./User");
const Team = require("./Team");
const UserTeam = require("./UserTeam");
const Project = require("./Project");
const Node = require("./Node"); // 기존의 nodes 모델

// ✅ 데이터베이스 동기화 함수
const initDB = async () => {
  try {
    console.log("🔄 데이터베이스 동기화 시작...");
    await sequelize.authenticate();
    console.log("✅ MySQL 연결 성공");

    await sequelize.sync({ force: false });
    console.log("✅ 데이터베이스 동기화 완료");
    // process.exit(); // ✅ 실행 후 종료
  } catch (error) {
    console.error("❌ 데이터베이스 동기화 실패:", error);
    process.exit(1); // ❌ 서버 종료
  }
};

// initDB();

module.exports = { sequelize, User, Team, UserTeam, Project, Node, initDB };
