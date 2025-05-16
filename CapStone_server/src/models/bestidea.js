const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/localDB");

const BestIdea = sequelize.define(
  "BestIdea",
  {
    bi_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
    
  },
  {
    tableName: "best_idea",
    timestamps: false,
  }
);

module.exports = BestIdea;
