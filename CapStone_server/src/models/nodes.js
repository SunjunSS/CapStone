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
    node_key: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_key: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
