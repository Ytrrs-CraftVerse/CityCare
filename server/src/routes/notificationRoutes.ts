import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getNotifications, markAsRead, markAllRead, getUnreadCount,
} from "../controllers/notificationController";

const router = Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.put("/read-all", protect, markAllRead);
router.put("/:id/read", protect, markAsRead);

export default router;
