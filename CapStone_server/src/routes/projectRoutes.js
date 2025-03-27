const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController.js");

// 프로젝트에 대한 CRUD
router.post("/", projectController.createProject); // 프로젝트 생성 요청
router.get("/:user_id", projectController.getProjectsByUserId); //유저 id로 프로젝트 조회
router.patch("/:project_id", projectController.updateProjectAndRootNodeName); // 프로젝트 id로 수정
router.delete("/:project_id", projectController.deleteProject); // 프로젝트 id로 프로젝트 삭제
// 프로젝트에 유저 역할 수정
router.patch(
  "/:project_id/members/:user_id/role",
  projectController.updateMemberRole
);

// 프로젝트에 대한 유저 CRUD
router.post("/:project_id/members", projectController.addMemberToProject); // 프로젝트에 유저 추가
router.delete(
  "/:project_id/members/:user_id",
  projectController.removeMemberFromProject
); //프로젝트에서 유저 제거
router.get("/:project_id/members", projectController.getProjectMembers); // 프로젝트에 있는 멤버 조회

module.exports = router;
