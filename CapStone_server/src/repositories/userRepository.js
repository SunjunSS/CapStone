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
