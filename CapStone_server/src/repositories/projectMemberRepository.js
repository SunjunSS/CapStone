const { ProjectMembers } = require("../models");
const { Op } = require("sequelize"); // Op 연산자를 가져옵니다

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

// 여러 프로젝트의 모든 멤버 정보 조회
exports.getAllProjectsMembers = async (project_ids) => {
  try {
    if (!Array.isArray(project_ids) || project_ids.length === 0) {
      return [];
    }

    const members = await ProjectMembers.findAll({
      where: {
        project_id: {
          [Op.in]: project_ids,
        },
      },
    });

    return members;
  } catch (error) {
    console.error("❌ 여러 프로젝트의 멤버 조회 실패:", error);
    throw error;
  }
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

// 즐겨찾기 설정/해제
exports.updateBookmark = async (user_id, project_id, bookmark, transaction) => {
  return await ProjectMembers.update(
    { bookmark },
    { where: { user_id, project_id }, transaction }
  );
};
