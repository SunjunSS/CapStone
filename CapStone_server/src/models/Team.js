const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Team = sequelize.define(
  "Team",
  {
    team_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    leader_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "team",
    timestamps: false,
  }
);

module.exports = Team;
