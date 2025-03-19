const projectService = require("../services/projectService/projectService.js");

exports.createProject = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id가가 필요합니다." });
    }

    const project = await projectService.createProjectWithUser(user_id);
    res.status(201).json({ message: "프로젝트 생성 성공", project });
  } catch (error) {
    console.error("프로젝트 생성 중 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.getProjectsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "user_id가 필요합니다." });
    }

    const projectIds = await projectService.getProjectsByUserId(user_id);
    res.status(200).json({ projects: projectIds });
  } catch (error) {
    console.error("프로젝트 조회 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

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

exports.deleteProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({ message: "프로젝트 ID가 필요합니다." });
    }

    await projectService.deleteProject(project_id);

    res.status(200).json({ message: "프로젝트가 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("❌ 프로젝트 삭제 오류:", error);
    res
      .status(500)
      .json({ message: "삭제 중 오류 발생", error: error.message });
  }
};
