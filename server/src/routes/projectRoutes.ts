import { Router } from "express";
import { protect, adminOnly } from "../middleware/authMiddleware";
import {
  createProject, getProjects, voteOnProject, updateProject, deleteProject,
} from "../controllers/projectController";

const router = Router();

router.get("/", getProjects);
router.post("/", protect, adminOnly, createProject);
router.post("/:id/vote", protect, voteOnProject);
router.put("/:id", protect, adminOnly, updateProject);
router.delete("/:id", protect, adminOnly, deleteProject);

export default router;
