const express = require("express");
const router = express.Router();

const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  getNearbyIssues,
  getTrendingIssues,
  updateStatus,
  getStats,
  getMyIssues,
  upvoteIssue,
  addComment,
} = require("../controllers/issueController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, createIssue);

router.get("/", getIssues);
router.get("/stats", getStats);
router.get("/nearby", getNearbyIssues);
router.get("/trending", getTrendingIssues);
router.get("/my", protect, getMyIssues);

router.get("/:id", getIssueById);

router.post("/:id/upvote", protect, upvoteIssue);
router.post("/:id/comments", protect, addComment);

router.put("/:id", protect, adminOnly, updateIssue);
router.patch("/:id/status", protect, adminOnly, updateStatus);
router.delete("/:id", protect, adminOnly, deleteIssue);

module.exports = router;