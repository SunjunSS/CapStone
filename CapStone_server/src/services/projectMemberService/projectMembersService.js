const { ProjectMembers } = require("../../models");

// ✅ 프로젝트에 사용자 추가
exports.addProjectMember = async (
  user_id,
  project_id,
  isAdmin,
  transaction
) => {
  if (!user_id || !project_id) {
    throw new Error("사용자 ID와 프로젝트 ID가 필요합니다.");
  }

  try {
    const newMember = await ProjectMembers.create(
      { user_id, project_id, isAdmin },
      { transaction } // ✅ 트랜잭션 지원
    );

    console.log(`✅ 사용자(${user_id})가 프로젝트(${project_id})에 추가됨`);
    return newMember;
  } catch (error) {
    console.error("❌ 프로젝트 멤버 추가 중 오류 발생:", error.message);
    throw new Error("프로젝트 멤버 추가 중 오류 발생");
  }
};

// ✅ 사용자가 속한 프로젝트 ID 및 isAdmin 정보 조회
exports.getUserProjectIds = async (user_id) => {
  try {
    if (!user_id) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    const projectMembers = await ProjectMembers.findAll({
      where: { user_id },
      attributes: ["project_id", "isAdmin"],
      raw: true, // ✅ JSON 형태로 반환
    });

    return projectMembers;
  } catch (error) {
    console.error("❌ 사용자의 프로젝트 ID 조회 중 오류 발생:", error);
    throw error;
  }
};
