const sequelize = require("../config/localDB");

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
  try {
    console.log("🔄 데이터베이스 동기화 시작...");
    await sequelize.authenticate();
    console.log("✅ MySQL 연결 성공");

    await sequelize.sync({ force: false }); // 데이터베이스 동기화 (기존 데이터 유지)
    console.log("✅ 데이터베이스 동기화 완료");
  } catch (error) {
    console.error("❌ 데이터베이스 동기화 실패:", error);
    process.exit(1);
  }
};

// ✅ 내보내기 (모든 모델 포함)
module.exports = { sequelize, User, Team, TeamMember, Project, Node, initDB };
