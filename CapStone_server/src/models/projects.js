const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB"); // DB 연결 설정 파일
const Team = require("./teams"); // teams 테이블 모델 (Team 모델이 정의되어 있다고 가정)

const Project = sequelize.define(
  "Project",
  {
    project_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Team, // teams 테이블과 연결
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "projects", // 테이블명 지정
    timestamps: false, // createdAt, updatedAt 자동 생성 방지
  }
);

// Team 모델과 관계 설정
Project.belongsTo(Team, { foreignKey: "team_id" });
Team.hasMany(Project, { foreignKey: "team_id" });

module.exports = Project;
