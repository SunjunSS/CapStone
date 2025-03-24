// userRepository.js
const { User } = require("../models");

exports.getUsersByIds = async (userIds) => {
  return await User.findAll({
    where: { user_id: userIds },
    attributes: ["user_id", "name", "email"],
  });
};
