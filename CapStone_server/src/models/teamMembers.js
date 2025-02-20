const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB"); // DB 연결 설정 파일
const Team = require("./teams");
const User = require("./users");

const TeamMember = sequelize.define(
  "TeamMember",
  {
    member_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Team,
        key: "team_id",
      },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "team_members", // 테이블명 지정
    timestamps: false, // createdAt, updatedAt 자동 생성 방지
  }
);

// 관계 설정
TeamMember.belongsTo(Team, { foreignKey: "team_id" });
TeamMember.belongsTo(User, { foreignKey: "user_id" });
Team.hasMany(TeamMember, { foreignKey: "team_id" });
User.hasMany(TeamMember, { foreignKey: "user_id" });

module.exports = TeamMember;
