const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Node = sequelize.define(
  "Node",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    node_key: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // 고유 키 설정
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "project", // 프로젝트 테이블과 연결
        key: "project_id",
      },
      onDelete: "CASCADE",
    },
    parent_key: {
      type: DataTypes.INTEGER, // ✅ node_key와 같은 타입으로 변경
      allowNull: true,
      references: {
        model: "nodes",
        key: "node_key",
      },
      onDelete: "CASCADE",
    },
    content: {
      type: DataTypes.CHAR(255),
      allowNull: false,
    },
  },
  {
    tableName: "nodes",
    timestamps: false, // createdAt, updatedAt 자동 생성 방지
  }
);

module.exports = Node;
