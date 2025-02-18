const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Team = require("./Team");

const Project = sequelize.define(
  "Project",
  {
    project_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
  },
  {
    tableName: "project",
    timestamps: false,
  }
);

// 프로젝트 - 팀 관계 설정
Team.hasMany(Project, { foreignKey: "team_id" });
Project.belongsTo(Team, { foreignKey: "team_id" });

module.exports = Project;
