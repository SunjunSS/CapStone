const { Project, sequelize } = require("../../models"); // ✅ `Project` 테이블만 사용
const nodeRepository = require("../../repositories/nodeRepository");
const projectRepository = require("../../repositories/projectRepository"); // ✅ 추가
const projectMemberRepository = require("../../repositories/projectMemberRepository");

exports.createProjectWithUser = async (user_id) => {
  const transaction = await sequelize.transaction(); // 트랜잭션 시작

  try {
    // 1️⃣ 프로젝트 생성 (기본 이름 사용)
    const project = await projectRepository.createProject(
      "나의 새 마인드맵",
      transaction
    );

    // 2️⃣ 사용자 추가 (ProjectMembers 테이블 관리)
    await projectMemberRepository.addProjectMember(
      user_id,
      project.project_id,
      3,
      transaction
    );

    // 3️⃣ 루트 노드 생성 (Node 테이블 관리)
    await nodeRepository.createNode(
      "나의 새 마인드맵",
      null,
      project.project_id,
      false,
      transaction
    );

    await transaction.commit(); // ✅ 트랜잭션 커밋
    return project;
  } catch (error) {
    await transaction.rollback(); // ❌ 오류 발생 시 롤백
    console.error("❌ 프로젝트 생성 중 오류:", error);
    throw error;
  }
};

exports.getProjectsByUserId = async (user_id) => {
  try {
    // ✅ 프로젝트 멤버 서비스에서 사용자의 프로젝트 ID 목록 가져오기
    const userProjects = await projectMemberRepository.getUserProjectIds(
      user_id
    );
    if (!userProjects || userProjects.length === 0) {
      return [];
    }

    // ✅ 프로젝트 ID 목록을 사용하여 프로젝트 정보 조회
    const projects = await Project.findAll({
      attributes: ["project_id", "name"],
      where: { project_id: userProjects.map((p) => p.project_id) }, // 🔥 `IN` 조건 사용
      raw: true,
    });

    // ✅ `isAdmin` 정보를 추가하여 반환
    return projects.map((project) => ({
      project_id: project.project_id,
      name: project.name,
      isAdmin:
        userProjects.find((p) => p.project_id === project.project_id)
          ?.isAdmin || 0, // ✅ isAdmin 값 추가
    }));
  } catch (error) {
    console.error("❌ 유저의 프로젝트 조회 중 오류 발생:", error);
    throw error;
  }
};

/**
 * ✅ 프로젝트 이름 수정 + 루트 노드 이름 수정 (트랜잭션 적용)
 */
exports.updateProjectAndRootNodeName = async (project_id, newName) => {
  if (!project_id || !newName) {
    throw new Error("프로젝트 ID와 새 이름이 필요합니다.");
  }

  const transaction = await sequelize.transaction();
  try {
    // ✅ 프로젝트 이름 수정
    const projectUpdated = await projectRepository.updateProjectName(
      project_id,
      newName,
      transaction
    );

    if (!projectUpdated) {
      throw new Error("프로젝트를 찾을 수 없거나 수정할 수 없습니다.");
    }

    // ✅ 루트 노드 이름도 변경
    const rootNodeUpdated = await nodeRepository.updateRootNodeName(
      project_id,
      newName,
      transaction
    );

    if (!rootNodeUpdated) {
      throw new Error("루트 노드를 찾을 수 없거나 수정할 수 없습니다.");
    }

    await transaction.commit();
    console.log(
      `✅ 프로젝트(${project_id}) 및 루트 노드 이름 수정 완료:`,
      newName
    );
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 프로젝트 및 루트 노드 이름 수정 실패:", error.message);
    throw new Error("프로젝트 및 루트 노드 이름 수정 중 오류 발생");
  }
};
