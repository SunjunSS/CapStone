const { ProjectMembers } = require("../models");

//✅ 프로젝트에 사용자 추가
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

//✅ 사용자가 속한 프로젝트 ID 및 isAdmin 정보 조회
exports.getUserProjectIds = async (user_id) => {
  return await ProjectMembers.findAll({
    where: { user_id },
    attributes: ["project_id", "isAdmin"],
    raw: true,
  });
};

// 특정 프로젝트의 모든 멤버 삭제
exports.deleteProjectMembers = async (project_id, transaction) => {
  return await ProjectMembers.destroy({
    where: { project_id },
    transaction,
  });
};

// 프로젝트에 해당하는 특정 유저만 프로젝트에서 제외
exports.removeProjectMember = async (user_id, project_id, transaction) => {
  return await ProjectMembers.destroy({
    where: {
      user_id,
      project_id,
    },
    transaction,
  });
};

exports.isUserInProject = async (user_id, project_id) => {
  const member = await ProjectMembers.findOne({
    where: { user_id, project_id },
  });
  return !!member; // 존재하면 true 반환
};

// projectMemberRepository.js
exports.getProjectMemberIds = async (project_id) => {
  return await ProjectMembers.findAll({
    where: { project_id },
    attributes: ["user_id", "isAdmin"],
  });
};

// 프로젝트 멤버 역할 수정
exports.updateProjectMemberRole = async (
  user_id,
  project_id,
  role,
  transaction
) => {
  return await ProjectMembers.update(
    { isAdmin: role },
    { where: { user_id, project_id }, transaction }
  );
};
