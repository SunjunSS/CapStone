const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB");

const ProjectMembers = sequelize.define(
  "projectmembers",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // ✅ 복합 키 설정
    },

    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // ✅ 복합 키 설정
    },

    isAdmin: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bookmark: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "project_members",
    timestamps: false,
  }
);

module.exports = ProjectMembers;
