const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB");

const TeamMember = sequelize.define(
  "TeamMember",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
