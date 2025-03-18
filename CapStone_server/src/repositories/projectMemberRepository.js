const { ProjectMembers } = require("../models");

/**
 * ✅ 프로젝트에 사용자 추가
 */
exports.addProjectMember = async (
  user_id,
  project_id,
  isAdmin,
  transaction
) => {
  return await ProjectMembers.create(
    { user_id, project_id, isAdmin },
    { transaction }
  );
};

/**
 * ✅ 사용자가 속한 프로젝트 ID 및 isAdmin 정보 조회
 */
exports.getUserProjectIds = async (user_id) => {
  return await ProjectMembers.findAll({
    where: { user_id },
    attributes: ["project_id", "isAdmin"],
    raw: true,
  });
};
