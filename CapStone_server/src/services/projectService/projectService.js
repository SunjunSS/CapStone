const { sequelize } = require("../../models");
const nodeRepository = require("../../repositories/nodeRepository");
const projectRepository = require("../../repositories/projectRepository");
const projectMemberRepository = require("../../repositories/projectMemberRepository");
const userRepository = require("../../repositories/userRepository");
const { ROLE_LABELS } = require("../../constants/roles");
const { formatDateToYMDHM } = require("../../utils/dateFormatter");

// 프로젝트 생성, 프로젝트 유저 매핑, 루트 노드 생성
exports.createProjectWithUser = async (user_id, category = null) => {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ 프로젝트 생성 (기본 이름 사용)
    const project = await projectRepository.createProject(
      "나의 새 마인드맵",
      transaction,
      category
    );

    // 2️⃣ 사용자 추가 (ProjectMembers 테이블 관리) - isAdmin 값을 4로 설정
    await projectMemberRepository.addProjectMember(
      user_id,
      project.project_id,
      4, // isAdmin 값을 4로 변경 (기존 3에서 변경)
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

    await transaction.commit();
    return project;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 프로젝트 생성 중 오류:", error);
    throw error;
  }
};

// 유저ID로 활성 프로젝트 찾기 (deleted=0인 프로젝트만, 생성자 이름 포함)
exports.getActiveProjectsByUserId = async (user_id) => {
  try {
    console.log(
      `🔍 [getActiveProjectsByUserId] 사용자 ID: ${user_id} 의 활성 프로젝트 조회 시작`
    );

    // ✅ 프로젝트 멤버 서비스에서 사용자의 프로젝트 ID 목록 가져오기
    const userProjects = await projectMemberRepository.getUserProjectIds(
      user_id
    );
    console.log(
      `🔍 [getActiveProjectsByUserId] 사용자의 프로젝트 ID 목록:`,
      JSON.stringify(userProjects)
    );

    if (!userProjects || userProjects.length === 0) {
      console.log(
        `🔍 [getActiveProjectsByUserId] 사용자의 프로젝트가 없습니다.`
      );
      return [];
    }

    // ✅ 프로젝트 ID 목록을 사용하여 프로젝트 정보 조회 (레포지토리 사용)
    const projects = await projectRepository.getUserProjects(
      userProjects.map((p) => p.project_id)
    );
    console.log(
      `🔍 [getActiveProjectsByUserId] 조회된 전체 프로젝트:`,
      JSON.stringify(projects)
    );

    // ✅ `deleted=0`인 프로젝트만 필터링
    const activeProjects = projects.filter((project) => project.deleted === 0);
    console.log(
      `🔍 [getActiveProjectsByUserId] 필터링된 활성 프로젝트 (deleted=0):`,
      JSON.stringify(activeProjects)
    );
    console.log(
      `🔍 [getActiveProjectsByUserId] 활성 프로젝트 수: ${activeProjects.length}`
    );

    // 프로젝트 ID 목록을 추출
    const projectIds = activeProjects.map((project) => project.project_id);

    // 각 프로젝트의 모든 멤버 정보를 가져옴 (프로젝트 ID 목록 전달)
    const allProjectMembers =
      await projectMemberRepository.getAllProjectsMembers(projectIds);

    // 각 프로젝트별 생성자(isAdmin=4) 찾기
    const projectCreators = {};
    allProjectMembers.forEach((member) => {
      if (member.isAdmin === 4) {
        projectCreators[member.project_id] = member.user_id;
      }
    });

    // 생성자 ID 목록 추출
    const creatorIds = Object.values(projectCreators);

    // 생성자들의 사용자 정보 일괄 조회
    const creators = await userRepository.getUsersByIds(creatorIds);

    // 생성자 ID와 이름을 매핑한 객체 생성
    const creatorNameMap = {};
    creators.forEach((creator) => {
      creatorNameMap[creator.user_id] = creator.name;
    });

    // ✅ `isAdmin` 정보와 생성자 이름을 추가하여 반환
    const result = activeProjects.map((project) => {
      const creatorId = projectCreators[project.project_id];
      const creatorName = creatorNameMap[creatorId] || "알 수 없음";

      return {
        project_id: project.project_id,
        name: project.name,
        creator: creatorName, // 생성자 이름 추가
        isAdmin:
          userProjects.find((p) => p.project_id === project.project_id)
            ?.isAdmin || 0, // ✅ isAdmin 값 추가
        date: formatDateToYMDHM(project.updatedAt), // 🔁 updatedAt → date
      };
    });

    console.log(
      `🔍 [getActiveProjectsByUserId] 최종 결과:`,
      JSON.stringify(result)
    );
    return result;
  } catch (error) {
    console.error("❌ 유저의 활성 프로젝트 조회 중 오류 발생:", error);
    throw error;
  }
};

// 즐겨찾기한 프로젝트 조회
exports.getBookmarkedProjectsByUserId = async (user_id) => {
  try {
    console.log("🔍 즐겨찾기 프로젝트 조회 요청 user_id:", user_id);
    const projects = await projectRepository.getBookmarkedProjectsByUserId(
      user_id
    );

    // 프로젝트가 없으면 빈 배열 반환
    if (!projects || projects.length === 0) {
      return [];
    }

    // 프로젝트 ID 목록을 추출
    const projectIds = projects.map((project) => project.project_id);

    // 각 프로젝트의 모든 멤버 정보를 가져옴
    const allProjectMembers =
      await projectMemberRepository.getAllProjectsMembers(projectIds);

    // 각 프로젝트별 생성자(isAdmin=4) 찾기
    const projectCreators = {};
    allProjectMembers.forEach((member) => {
      if (member.isAdmin === 4) {
        projectCreators[member.project_id] = member.user_id;
      }
    });

    // 생성자 ID 목록 추출
    const creatorIds = Object.values(projectCreators);

    // 생성자들의 사용자 정보 일괄 조회
    const creators = await userRepository.getUsersByIds(creatorIds);

    // 생성자 ID와 이름을 매핑한 객체 생성
    const creatorNameMap = {};
    creators.forEach((creator) => {
      creatorNameMap[creator.user_id] = creator.name;
    });

    // isAdmin 정보와 생성자 이름을 추가하여 반환
    const result = projects.map((project) => {
      const creatorId = projectCreators[project.project_id];
      const creatorName = creatorNameMap[creatorId] || "알 수 없음";

      return {
        project_id: project.project_id,
        name: project.name,
        creator: creatorName, // 생성자 이름 추가
        isAdmin: project.isAdmin || 0,
        date: formatDateToYMDHM(project.updatedAt),
      };
    });

    console.log("✅ 포맷팅된 즐겨찾기 프로젝트 결과:", result);

    return result;
  } catch (error) {
    console.error("❌ 즐겨찾기 프로젝트 서비스 오류:", error);
    throw error;
  }
};

// 즐겨찾기 설정/해제
exports.updateProjectBookmark = async (user_id, project_id, bookmark) => {
  const transaction = await sequelize.transaction();
  try {
    await projectMemberRepository.updateBookmark(
      user_id,
      project_id,
      bookmark,
      transaction
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// 유저ID로 휴지통 프로젝트 찾기 (deleted=1인 프로젝트만, 생성자 이름 포함)
exports.getTrashProjectsByUserId = async (user_id) => {
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

    // ✅ `deleted=1`인 프로젝트만 필터링
    const trashProjects = projects.filter((project) => project.deleted === 1);

    // 프로젝트가 없으면 빈 배열 반환
    if (trashProjects.length === 0) {
      return [];
    }

    // 프로젝트 ID 목록을 추출
    const projectIds = trashProjects.map((project) => project.project_id);

    // 각 프로젝트의 모든 멤버 정보를 가져옴
    const allProjectMembers =
      await projectMemberRepository.getAllProjectsMembers(projectIds);

    // 각 프로젝트별 생성자(isAdmin=4) 찾기
    const projectCreators = {};
    allProjectMembers.forEach((member) => {
      if (member.isAdmin === 4) {
        projectCreators[member.project_id] = member.user_id;
      }
    });

    // 생성자 ID 목록 추출
    const creatorIds = Object.values(projectCreators);

    // 생성자들의 사용자 정보 일괄 조회
    const creators = await userRepository.getUsersByIds(creatorIds);

    // 생성자 ID와 이름을 매핑한 객체 생성
    const creatorNameMap = {};
    creators.forEach((creator) => {
      creatorNameMap[creator.user_id] = creator.name;
    });

    // ✅ `isAdmin` 정보와 생성자 이름을 추가하여 반환
    return trashProjects.map((project) => {
      const creatorId = projectCreators[project.project_id];
      const creatorName = creatorNameMap[creatorId] || "알 수 없음";

      return {
        project_id: project.project_id,
        name: project.name,
        creator: creatorName, // 생성자 이름 추가
        date: formatDateToYMDHM(project.updatedAt), // 🔁 updatedAt → date
        isAdmin:
          userProjects.find((p) => p.project_id === project.project_id)
            ?.isAdmin || 0, // ✅ isAdmin 값 추가
      };
    });
  } catch (error) {
    console.error("❌ 유저의 휴지통 프로젝트 조회 중 오류 발생:", error);
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

// 프로젝트 휴지통으로 이동
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

// 프로젝트 완전 삭제
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
  const transaction = await sequelize.transaction();
  try {
    const project = await projectRepository.getProjectById(project_id);
    if (!project) {
      throw new Error("복원할 프로젝트가 없습니다.");
    }

    if (project.deleted === 0) {
      throw new Error("이미 활성 상태인 프로젝트입니다.");
    }

    // deleted = 0으로 변경
    await projectRepository.updateProjectDeletedFlag(
      project_id,
      0,
      transaction
    );

    await transaction.commit();
    console.log(`♻️ 프로젝트(${project_id}) 복원 완료`);
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 프로젝트 복원 실패:", error.message);
    throw error;
  }
};

// 프로젝트에 유저 추가
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

// 프로젝트에서 맴버 삭제
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

// 프로젝트의 맴버들 조회
exports.getProjectMembers = async (project_id) => {
  try {
    const memberRecords = await projectMemberRepository.getProjectMemberIds(
      project_id
    );
    const userIds = memberRecords.map((m) => m.user_id);

    const users = await userRepository.getUsersByIds(userIds);

    // 유저 정보와 isAdmin을 결합해서 정리
    const membersWithInfo = users.map((user) => {
      const memberInfo = memberRecords.find((m) => m.user_id === user.user_id);
      return {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        isAdmin: memberInfo?.isAdmin || 0,
      };
    });

    // isAdmin이 4인 멤버를 맨 앞으로 정렬하고, 그 외의 멤버는 그대로 유지
    const sortedMembers = membersWithInfo.sort((a, b) => {
      // isAdmin이 4인 멤버를 맨 앞으로 정렬
      if (a.isAdmin === 4 && b.isAdmin !== 4) {
        return -1; // a가 b보다 앞에 위치
      }
      if (a.isAdmin !== 4 && b.isAdmin === 4) {
        return 1; // b가 a보다 앞에 위치
      }
      // 그 외의 경우 순서 유지
      return 0;
    });

    return sortedMembers;
  } catch (error) {
    console.error("❌ 프로젝트 멤버 조회 오류:", error);
    throw error;
  }
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

// 프로젝트 카테고리 수정
exports.updateProjectCategory = async (project_id, category) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await projectRepository.getProjectById(project_id);
    if (!project) {
      throw new Error("프로젝트가 존재하지 않습니다.");
    }

    await projectRepository.updateProjectCategory(
      project_id,
      category,
      transaction
    );

    await transaction.commit();
    console.log(`✅ 프로젝트(${project_id}) 카테고리 수정 완료: ${category}`);
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("❌ 카테고리 업데이트 실패:", error.message);
    throw error;
  }
};
