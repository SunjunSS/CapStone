const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB"); // DB 연결 설정 파일

const Team = sequelize.define(
  "Team",
  {
    team_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    leader_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "teams", // 테이블명 지정
    timestamps: false, // createdAt, updatedAt 자동 생성 방지
  }
);

module.exports = Team;
