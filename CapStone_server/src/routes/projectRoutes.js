const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController.js");

router.post("/", projectController.createProject);
router.get("/:user_id", projectController.getProjectsByUserId);
module.exports = router;
