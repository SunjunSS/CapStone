const mysql = require("mysql2/promise"); // ✅ MySQL2 Promise 기반 사용
const sequelize = require("../config/localDB"); // ✅ Sequelize 인스턴스 가져오기
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

// ✅ MySQL 연결 정보
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
};

// ✅ 데이터베이스가 없으면 생성하는 함수
const createDatabaseIfNotExists = async () => {
  try {
    console.log("🔍 데이터베이스 존재 여부 확인 중...");

    // MySQL 기본 연결 (특정 데이터베이스 지정 X)
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    // ✅ 데이터베이스 생성 (존재하지 않을 경우)
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`
    );
    console.log(`✅ 데이터베이스 '${dbConfig.database}' 확인 완료 또는 생성됨`);

    await connection.end();
  } catch (error) {
    console.error("❌ 데이터베이스 생성 중 오류 발생:", error);
    process.exit(1);
  }
};

// 모델 불러오기
const User = require("./users");
const Team = require("./teams");
const TeamMember = require("./teamMembers");
const Project = require("./projects");
const Node = require("./nodes");

// ✅ 관계 설정 (One-To-Many, Many-To-Many 설정)
Team.hasMany(Project, { foreignKey: "team_id" });
Project.belongsTo(Team, { foreignKey: "team_id" });

User.belongsToMany(Team, { through: TeamMember, foreignKey: "user_id" });
Team.belongsToMany(User, { through: TeamMember, foreignKey: "team_id" });

Project.hasMany(Node, { foreignKey: "project_id", onDelete: "CASCADE" });
Node.belongsTo(Project, { foreignKey: "project_id" });

// ✅ 데이터베이스 동기화 함수
const initDB = async () => {
  await createDatabaseIfNotExists(); // 🔹 데이터베이스 존재 확인 후 생성
  try {
    console.log("🔄 데이터베이스 동기화 시작...");
    await sequelize.authenticate();
    console.log("✅ MySQL 데이터베이스 연결 성공");

    // ✅ 테이블 동기화
    await sequelize.sync({ force: false });
    console.log("✅ 데이터베이스 동기화 완료");
  } catch (error) {
    console.error("❌ 데이터베이스 동기화 실패:", error);
    process.exit(1);
  }
};

// ✅ 내보내기 (모든 모델 포함)
module.exports = { sequelize, User, Team, TeamMember, Project, Node, initDB };
