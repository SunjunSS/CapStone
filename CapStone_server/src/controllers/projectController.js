const projectService = require("../services/projectService/projectService.js");
const { ROLE_LABELS } = require("../constants/roles");

exports.createProject = async (req, res) => {
  try {
    const { user_id, category } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id가가 필요합니다." });
    }

    const project = await projectService.createProjectWithUser(
      user_id,
      category
    );
    res.status(201).json({ message: "프로젝트 생성 성공", project });
  } catch (error) {
    console.error("프로젝트 생성 중 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 활성 프로젝트만 조회 (deleted=0)
exports.getActiveProjectsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "user_id가 필요합니다." });
    }

    const projects = await projectService.getActiveProjectsByUserId(user_id);
    res.status(200).json({ projects });
  } catch (error) {
    console.error("활성 프로젝트 조회 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 즐겨찾기 프로젝트 조회
exports.getBookmarkedProjectsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ message: "user_id가 필요합니다." });
    }

    console.log("🔍 즐겨찾기 프로젝트 조회 요청 user_id:", user_id);

    const projects = await projectService.getBookmarkedProjectsByUserId(
      user_id
    );
    res.status(200).json({ projects });
  } catch (error) {
    console.error("❌ 즐겨찾기 프로젝트 컨트롤러 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 즐겨찾기 설정/해제
exports.toggleProjectBookmark = async (req, res) => {
  try {
    const { user_id, project_id } = req.params;
    const { bookmark } = req.body;

    if (![0, 1].includes(bookmark)) {
      return res
        .status(400)
        .json({ message: "bookmark 값은 0 또는 1이어야 합니다." });
    }

    await projectService.updateProjectBookmark(user_id, project_id, bookmark);
    res.status(200).json({ message: "즐겨찾기 상태가 변경되었습니다." });
  } catch (error) {
    console.error("❌ 즐겨찾기 토글 실패:", error.message);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 휴지통 프로젝트만 조회 (deleted=1)
exports.getTrashProjectsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "user_id가 필요합니다." });
    }

    const projects = await projectService.getTrashProjectsByUserId(user_id);
    res.status(200).json({ projects });
  } catch (error) {
    console.error("휴지통 프로젝트 조회 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 프로젝트 복원
exports.restoreProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({ message: "project_id가 필요합니다." });
    }

    await projectService.restoreProject(project_id);
    res.status(200).json({ message: "프로젝트가 성공적으로 복원되었습니다." });
  } catch (error) {
    console.error("❌ 프로젝트 복원 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 프로젝트 및 루트 노드 이름 변경경
exports.updateProjectAndRootNodeName = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { name } = req.body;

    if (!project_id || !name) {
      return res
        .status(400)
        .json({ message: "프로젝트 ID와 새 이름이 필요합니다." });
    }

    await projectService.updateProjectAndRootNodeName(project_id, name);

    res
      .status(200)
      .json({ message: "프로젝트 및 루트 노드 이름이 변경되었습니다." });
  } catch (error) {
    console.error("❌ 프로젝트 및 루트 노드 이름 수정 오류:", error);
    res
      .status(500)
      .json({ message: "수정 중 오류 발생", error: error.message });
  }
};

// ✅ 소프트 삭제
exports.softDeleteProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({ message: "project_id가 필요합니다." });
    }

    await projectService.softDeleteProject(project_id);

    res.status(200).json({ message: "프로젝트가 휴지통으로 이동되었습니다." });
  } catch (error) {
    console.error("❌ 소프트 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// ✅ 완전 삭제
exports.permanentlyDeleteProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({ message: "project_id가 필요합니다." });
    }

    await projectService.permanentlyDeleteProject(project_id);

    res.status(200).json({ message: "프로젝트가 완전히 삭제되었습니다." });
  } catch (error) {
    console.error("❌ 완전 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 프로젝트에 유저 추가
exports.addMemberToProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { email, role } = req.body;

    if (!project_id || !email) {
      return res
        .status(400)
        .json({ message: "project_id와 email가 필요합니다." });
    }

    await projectService.addMemberToProject(project_id, email, role);

    res
      .status(201)
      .json({ message: "유저가 프로젝트에 성공적으로 추가되었습니다." });
  } catch (error) {
    console.error("❌ 프로젝트에 유저 추가 중 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.removeMemberFromProject = async (req, res) => {
  try {
    const { project_id, user_id } = req.params;

    if (!project_id || !user_id) {
      return res
        .status(400)
        .json({ message: "project_id와 user_id가 필요합니다." });
    }

    await projectService.removeMemberFromProject(project_id, user_id);

    res.status(200).json({ message: "유저가 프로젝트에서 제거되었습니다." });
  } catch (error) {
    console.error("❌ 프로젝트에서 유저 제거 중 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.getProjectMembers = async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({ message: "project_id가 필요합니다." });
    }

    const members = await projectService.getProjectMembers(project_id);

    res.status(200).json({ members });
  } catch (error) {
    console.error("❌ 프로젝트 멤버 조회 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 프로젝트에 유저 역할 수정
exports.updateMemberRole = async (req, res) => {
  try {
    const { project_id, user_id } = req.params;
    const { role } = req.body;

    console.log("🟢 역할 업데이트 요청 받음: ", project_id, user_id, role); // 요청받은 데이터 로그

    if (!role || !project_id || !user_id) {
      return res
        .status(400)
        .json({ message: "프로젝트 ID, 유저 ID, 역할이 필요합니다." });
    }

    const roleValue = ROLE_LABELS[role];
    if (roleValue === undefined) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 역할(role) 값입니다." });
    }

    await projectService.updateMemberRole(project_id, user_id, roleValue);
    res
      .status(200)
      .json({ message: "유저 역할이 성공적으로 업데이트되었습니다." });
  } catch (error) {
    console.error("❌ 역할 수정 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 프로젝트 카테고리 수정
exports.updateProjectCategory = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { category } = req.body;

    if (!project_id || category === undefined) {
      return res
        .status(400)
        .json({ message: "프로젝트 ID와 카테고리가 필요합니다." });
    }

    await projectService.updateProjectCategory(project_id, category);

    res
      .status(200)
      .json({ message: "프로젝트 카테고리가 성공적으로 변경되었습니다." });
  } catch (error) {
    console.error("❌ 프로젝트 카테고리 수정 오류:", error);
    res
      .status(500)
      .json({ message: "카테고리 수정 중 오류 발생", error: error.message });
  }
};
