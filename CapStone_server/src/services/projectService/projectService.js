const { sequelize } = require("../../models"); // ✅ `Project` 테이블만 사용
const nodeRepository = require("../../repositories/nodeRepository");
const projectRepository = require("../../repositories/projectRepository"); // ✅ 추가
const projectMemberRepository = require("../../repositories/projectMemberRepository");
const userRepository = require("../../repositories/userRepository");
const { ROLE_LABELS } = require("../../constants/roles"); // 역할 매핑 상수 추가

// 프로젝트 생성, 프로젝트 유저 매핑, 루트 노드 생성
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

// 유저ID로 프로젝트 찾기
exports.getProjectsByUserId = async (user_id) => {
  try {
    // ✅ 프로젝트 멤버 서비스에서 사용자의 프로젝트 ID 목록 가져오기
    const userProjects = await projectMemberRepository.getUserProjectIds(
      user_id
    );
    if (!userProjects || userProjects.length === 0) {
      return [];
    }

    // ✅ 프로젝트 ID 목록을 사용하여 프로젝트 정보 조회 (레포지토리 사용)
    const projects = await projectRepository.getUserProjects(
      userProjects.map((p) => p.project_id)
    );

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

// 프로젝트, 루트 노드이름 수정
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

exports.softDeleteProject = async (project_id) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await projectRepository.getProjectById(project_id);
    if (!project) {
      throw new Error("삭제할 프로젝트가 없습니다.");
    }

    // ✅ deleted = 1 로 변경
    await projectRepository.updateProjectDeletedFlag(
      project_id,
      1,
      transaction
    );

    await transaction.commit();
    console.log(`🗑️ 프로젝트(${project_id}) 소프트 삭제 완료`);
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 소프트 삭제 실패:", error.message);
    throw error;
  }
};

exports.permanentlyDeleteProject = async (project_id) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await projectRepository.getProjectById(project_id);
    if (!project || project.deleted !== 1) {
      throw new Error("휴지통에 있는 프로젝트만 완전 삭제할 수 있습니다.");
    }

    // 관련된 노드, 멤버, 프로젝트 순으로 삭제
    await nodeRepository.deleteNodesByProjectId(project_id, transaction);
    await projectMemberRepository.deleteProjectMembers(project_id, transaction);
    await projectRepository.deleteProject(project_id, transaction);

    await transaction.commit();
    console.log(`🚮 프로젝트(${project_id}) 완전 삭제 완료`);
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 완전 삭제 실패:", error.message);
    throw error;
  }
};

// 복원
exports.restoreProject = async (project_id) => {
  return await updateProjectDeletedFlag(project_id, 0);
};

exports.addMemberToProject = async (project_id, email, role = 3) => {
  const transaction = await sequelize.transaction();
  try {
    // 문자열 role이 들어오면 숫자로 매핑
    let roleValue = role;
    if (typeof role === "string") {
      roleValue = ROLE_LABELS[role];
      if (roleValue === undefined) {
        throw new Error("유효하지 않은 역할(role) 값입니다.");
      }
    }

    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new Error("해당 이메일의 유저를 찾을 수 없습니다.");
    }

    const user_id = user.user_id;

    const project = await projectRepository.getProjectById(project_id);
    if (!project) {
      throw new Error("해당 프로젝트가 존재하지 않습니다.");
    }

    const exists = await projectMemberRepository.isUserInProject(
      user_id,
      project_id
    );
    if (exists) {
      throw new Error("이미 이 유저는 해당 프로젝트의 멤버입니다.");
    }

    await projectMemberRepository.addProjectMember(
      user_id,
      project_id,
      roleValue,
      transaction
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 유저 추가 실패:", error.message);
    throw error;
  }
};

exports.removeMemberFromProject = async (project_id, user_id) => {
  const transaction = await sequelize.transaction();
  try {
    const exists = await projectMemberRepository.isUserInProject(
      user_id,
      project_id
    );
    if (!exists) {
      throw new Error("해당 유저는 이 프로젝트에 포함되어 있지 않습니다.");
    }

    await projectMemberRepository.removeProjectMember(
      user_id,
      project_id,
      transaction
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 유저 제거 실패:", error.message);
    throw error;
  }
};

exports.getProjectMembers = async (project_id) => {
  const memberRecords = await projectMemberRepository.getProjectMemberIds(
    project_id
  );
  const userIds = memberRecords.map((m) => m.user_id);

  const users = await userRepository.getUsersByIds(userIds);

  // 유저 정보와 isAdmin을 결합해서 정리
  return users.map((user) => {
    const memberInfo = memberRecords.find((m) => m.user_id === user.user_id);
    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      isAdmin: memberInfo?.isAdmin || 0,
    };
  });
};

// 프로젝트에 유저 역할 수정
exports.updateMemberRole = async (project_id, user_id, role) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await projectRepository.getProjectById(project_id);
    if (!project) {
      throw new Error("프로젝트가 존재하지 않습니다.");
    }

    const user = await userRepository.getUserById(user_id); // 여기서 추가된 함수 호출
    if (!user) {
      throw new Error("유저를 찾을 수 없습니다.");
    }

    // 역할 업데이트
    await projectMemberRepository.updateProjectMemberRole(
      user_id,
      project_id,
      role,
      transaction
    );

    await transaction.commit();
    console.log(
      `✅ 프로젝트(${project_id})에 대한 유저(${user_id}) 역할 수정 완료: ${role}`
    );
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 역할 업데이트 실패:", error.message);
    throw error;
  }
};
