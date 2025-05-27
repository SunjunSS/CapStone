const mysql = require("mysql2/promise"); // ✅ MySQL2 Promise 기반 사용
const sequelize = require("../config/localDB"); // ✅ Sequelize 인스턴스 가져오기
const config = require("../config/envConfig"); // ✅ 환경 변수 로드

const dbConfig = {
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  port: config.db.port,
  database: config.db.name,
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
const Project = require("./projects");
const Node = require("./nodes");
const ProjectMembers = require("./projectMembers");
const ProjectMeeting = require("./projectMeeting");
const BestIdea = require("./bestidea")

// ✅ User와 projectmembers 관계 (1:N)
User.hasMany(ProjectMembers, { foreignKey: "user_id", onDelete: "CASCADE" });
ProjectMembers.belongsTo(User, { foreignKey: "user_id" });

// ✅ Project와 projectmembers 관계 (1:N)
Project.hasMany(ProjectMembers, { foreignKey: "project_id", onDelete: "CASCADE" });
ProjectMembers.belongsTo(Project, { foreignKey: "project_id" });

// ✅ Project와 Node 관계
Project.hasMany(Node, { foreignKey: "project_id", onDelete: "CASCADE" });
Node.belongsTo(Project, { foreignKey: "project_id" });

//✅Project와 project_Meeting 관계
Project.hasMany(ProjectMeeting, { foreignKey: "project_id",onDelete: "CASCADE" });
ProjectMeeting.belongsTo(Project, { foreignKey: "project_id" });

// ✅ Project와 BestIdea 관계 (1:N)
Project.hasMany(BestIdea, { foreignKey: "project_id", onDelete: "CASCADE" });
BestIdea.belongsTo(Project,{ foreignKey: "project_id" })

// ✅ 데이터베이스 동기화 함수
const initDB = async () => {
  await createDatabaseIfNotExists(); // 🔹 데이터베이스 존재 확인 후 생성
  try {
    console.log("🔄 데이터베이스 동기화 시작...");
    await sequelize.authenticate();
    console.log("✅ MySQL 데이터베이스 연결 성공");

    // ✅ 테이블 동기화
    await sequelize.sync({ force: false }); // true면 데이터베이스 다시 만들기, false면 기존 데이터베이스를 바꾸지 않고 동기화
    console.log("✅ 데이터베이스 동기화 완료");
  } catch (error) {
    console.error("❌ 데이터베이스 동기화 실패:", error);
    process.exit(1);
  }
};

// ✅ 내보내기 (모든 모델 포함)
module.exports = {
  sequelize,
  User,
  Project,
  Node,
  ProjectMembers,
  ProjectMeeting,
  BestIdea,
  initDB,
};
