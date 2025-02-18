const express = require("express");

module.exports = (io) => {
  const nodeController = require("../controllers/nodeController")(io);
  const router = express.Router();

  router.post("/save", nodeController.addNodes);
  router.delete("/delete", nodeController.deleteNodes);
  router.patch("/update", nodeController.updateNode);
  router.get("/", nodeController.getMindmap);

  return router;
};
