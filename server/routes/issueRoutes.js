const express = require("express");
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} = require("../controllers/issueController");
const { validateIssueCreate } = require("../middleware/errorMiddleware");

const router = express.Router();

router.route("/").post(validateIssueCreate, createIssue).get(getIssues);
router.route("/:id").get(getIssueById).patch(updateIssue).delete(deleteIssue);

module.exports = router;
