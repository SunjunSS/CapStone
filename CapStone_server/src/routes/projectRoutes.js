const express = require("express");
const router = express.Router();
const { createProjectController } = require("../controllers/projectController");

// 프로젝트 생성 API
router.post("/", async (req, res) => {
  const { user_id, name, description, topic } = req.body; // 요청 데이터

  try {
    const { project, team } = await createProjectController(
      user_id,
      name,
      description,
      topic
    );
    res.status(201).json({
      message: "프로젝트와 팀이 생성되었습니다.",
      project,
      team,
    });
  } catch (error) {
    console.error("프로젝트 생성 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
