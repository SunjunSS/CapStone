// routes/mailRoutes.js
const express = require("express");
const router = express.Router();
const mailController = require("../controllers/mailController");

router.post("/send-code", mailController.sendAuthCode);
router.post("/verify-code", mailController.verifyAuthCode);
router.post("/invite", mailController.sendInvitation);

module.exports = router;
