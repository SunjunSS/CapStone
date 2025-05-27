const { Sequelize } = require("sequelize");
const config = require("./envConfig"); // ✅ 환경 변수 로드

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    dialect: "mysql",
    port: config.db.port,
    timezone: "+09:00", // ✅ 한국 시간대로 설정
  }
);

module.exports = sequelize;
