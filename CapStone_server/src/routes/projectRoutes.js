const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController.js");

router.post("/", projectController.createProject);
router.post("/:project_id/members", projectController.addMemberToProject); // 프로젝트에 유저 추가
router.get("/:user_id", projectController.getProjectsByUserId);
router.patch("/:project_id", projectController.updateProjectAndRootNodeName);
router.delete("/:project_id", projectController.deleteProject);
// router.delete(
//   "/:project_id/members/:user_id",
//   projectController.removeMemberFromProject
// ); //프로젝트에서 유저 제거
// router.get("/:project_id/members", projectController.getProjectMembers); // 프로젝트에 있는 멤버 조회회
module.exports = router;
