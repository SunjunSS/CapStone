// userRepository.js
const { User } = require("../models");

exports.getUsersByIds = async (userIds) => {
  return await User.findAll({
    where: { user_id: userIds },
    attributes: ["user_id", "name", "email"],
  });
};

exports.getUserByEmail = async (email) => {
  return await User.findOne({
    where: { email },
    attributes: ["user_id", "name", "email"],
  });
};

// 새로운 함수 추가
exports.getUserById = async (user_id) => {
  return await User.findOne({
    where: { user_id }, // user_id를 사용하여 사용자 조회
    attributes: ["user_id", "name", "email"],
  });
};
