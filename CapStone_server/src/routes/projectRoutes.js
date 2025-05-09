const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController.js");

// 프로젝트에 대한 CRUD
router.post("/", projectController.createProject); // 프로젝트 생성 요청

// 프로젝트 조회 관련 라우트
router.get("/:user_id", projectController.getActiveProjectsByUserId); // 기본 조회는 활성 프로젝트만
router.get("/:user_id/trash", projectController.getTrashProjectsByUserId); // 휴지통에 있는 프로젝트 조회
router.get(
  "/:user_id/bookmarked",
  projectController.getBookmarkedProjectsByUserId
);

// 프로젝트 수정 및 상태 변경
router.patch("/:project_id", projectController.updateProjectAndRootNodeName); // 프로젝트 id로 수정
router.patch("/:project_id/delete", projectController.softDeleteProject); // 🗑️ 프로젝트 휴지통으로 보내기 (soft delete)
router.patch("/:project_id/restore", projectController.restoreProject); // ♻️ 프로젝트 복원 (휴지통에서 되돌리기)
router.delete("/:project_id", projectController.permanentlyDeleteProject); // 🚮 프로젝트 완전 삭제 (휴지통에서 제거)
router.patch("/:project_id/category", projectController.updateProjectCategory); // 프로젝트 카테고리 수정
router.patch(
  "/:project_id/bookmark/:user_id",
  projectController.toggleProjectBookmark
);


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
