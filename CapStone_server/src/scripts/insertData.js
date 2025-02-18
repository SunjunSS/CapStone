// 데이터베이스 초기 더미 데이터 필요하면 실행시키는 파일

// ✅ .env 파일 로드 (필수)
require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const { sequelize, initDB } = require("../models");

const insertData = async () => {
  try {
    console.log("🔄 초기 데이터 삽입 시작...");

    await initDB(); // ✅ 데이터베이스 동기화

    await sequelize.query(
      `INSERT INTO user (name, email, password) VALUES (?, ?, ?)`,
      { replacements: ["김문권", "ok63477@gmail.com", "1234"] }
    );

    await sequelize.query(
      `INSERT INTO team (name, leader_email) VALUES (?, ?)`,
      { replacements: ["Capstone Team", "ok63477@gmail.com"] }
    );

    await sequelize.query(
      `INSERT INTO user_team (user_id, team_id) VALUES (?, ?)`,
      { replacements: [1, 1] }
    );

    await sequelize.query(
      `INSERT INTO project (name, description, team_id) VALUES (?, ?, ?)`,
      {
        replacements: [
          "마인드맵 프로젝트",
          "마인드맵을 위한 웹 애플리케이션",
          1,
        ],
      }
    );

    await sequelize.query(
      `INSERT INTO nodes (node_key, project_id, parent_key, content) VALUES (?, ?, ?, ?)`,
      { replacements: [1, 1, null, "루트 노드"] }
    );

    console.log("✅ 초기 데이터 삽입 완료!");
    process.exit(); // ✅ 실행 후 종료
  } catch (error) {
    console.error("❌ 초기 데이터 삽입 실패:", error);
    process.exit(1); // ❌ 오류 발생 시 종료
  }
};

// ✅ 실행
insertData();
