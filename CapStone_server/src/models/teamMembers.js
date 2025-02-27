const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB");

const TeamMember = sequelize.define(
  "TeamMember",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // ✅ 복합 키 설정
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // ✅ 복합 키 설정
    },
    isAdmin: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "team_members",
    timestamps: false,
  }
);

module.exports = TeamMember;
