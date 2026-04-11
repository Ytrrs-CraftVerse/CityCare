const express = require("express");
const router = express.Router();

const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  getNearbyIssues,
} = require("../controllers/issueController");

router.post("/", createIssue);
router.get("/", getIssues);

router.get("/nearby", getNearbyIssues);

router.get("/:id", getIssueById);
router.put("/:id", updateIssue);
router.delete("/:id", deleteIssue);

module.exports = router;