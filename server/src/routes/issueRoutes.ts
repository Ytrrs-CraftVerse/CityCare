import { Router, Request, Response } from "express";
import { protect, optionalAuth, adminOnly } from "../middleware/authMiddleware";
import { upload } from "../middleware/upload";
import {
  createIssue, getIssues, getIssueById, updateIssue, deleteIssue,
  upvoteIssue, addComment, verifyIssue, getMyIssues, getStats,
  getNearbyIssues, findDuplicates, suggestCategoryFromText,
  getAuditTrail, verifyAuditTrailEndpoint, getDigitalTwinData,
} from "../controllers/issueController";

const router = Router();

router.get("/stats", getStats);
router.get("/my", protect, getMyIssues);
router.get("/nearby", getNearbyIssues);
router.get("/duplicates", findDuplicates);
router.get("/digital-twin", getDigitalTwinData);
router.post("/suggest-category", suggestCategoryFromText);

router.post("/upload-image", optionalAuth, upload.single("image"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: "No image file provided" });
    return;
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl, filename: req.file.filename, size: req.file.size });
});

router.post("/", optionalAuth, createIssue);
router.get("/", getIssues);

router.get("/:id", getIssueById);
router.put("/:id", protect, updateIssue);
router.delete("/:id", protect, adminOnly, deleteIssue);

router.post("/:id/upvote", protect, upvoteIssue);
router.post("/:id/comments", protect, addComment);
router.post("/:id/verify", protect, verifyIssue);

router.get("/:id/audit", getAuditTrail);
router.get("/:id/audit/verify", verifyAuditTrailEndpoint);

export default router;
