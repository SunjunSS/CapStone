const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB");

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
  },
  {
    tableName: "projects",
    timestamps: false,
  }
);

module.exports = Project;
