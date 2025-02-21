const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB");

const Node = sequelize.define(
  "Node",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_key: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "nodes", // 자기 자신을 참조하는 설정
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    content: {
      type: DataTypes.CHAR(255),
      allowNull: false,
    },
  },
  {
    tableName: "nodes",
    timestamps: false,
  }
);

module.exports = Node;
