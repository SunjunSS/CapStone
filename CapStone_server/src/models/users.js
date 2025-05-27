const { DataTypes } = require("sequelize");
const sequelize = require("../config/localDB"); // DB 연결 설정 파일

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "users", // 테이블명 지정
    timestamps: false, // createdAt, updatedAt 자동 생성 방지
  }
);

module.exports = User;
