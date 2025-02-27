const projectService = require("../services/projectService/projectService.js");

exports.createProject = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id가가 필요합니다." });
    }

    const project = await projectService.createProjectWithTeamAndNodes(user_id);
    res.status(201).json({ message: "프로젝트 생성 성공", project });
  } catch (error) {
    console.error("프로젝트 생성 중 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

exports.getUserProjects = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "user_id가 필요합니다." });
    }

    const projectIds = await projectService.getUserProjects(user_id);
    res.status(200).json({ projects: projectIds });
  } catch (error) {
    console.error("프로젝트 조회 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};
