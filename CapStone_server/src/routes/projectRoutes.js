const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController.js");

router.post("/", projectController.createProject);
router.get("/:user_id", projectController.getProjectsByUserId);
router.patch("/:project_id", projectController.updateProjectAndRootNodeName);
router.delete("/:project_id", projectController.deleteProject);
module.exports = router;
