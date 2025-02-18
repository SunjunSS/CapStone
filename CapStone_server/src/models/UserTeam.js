const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Team = require("./Team");

const UserTeam = sequelize.define(
  "UserTeam",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
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
    tableName: "user_team",
    timestamps: false,
  }
);

// 다대다 관계 설정
User.belongsToMany(Team, { through: UserTeam, foreignKey: "user_id" });
Team.belongsToMany(User, { through: UserTeam, foreignKey: "team_id" });

module.exports = UserTeam;
