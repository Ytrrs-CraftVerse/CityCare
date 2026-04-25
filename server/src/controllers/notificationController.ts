import { Request, Response, NextFunction } from "express";
import Notification from "../models/Notification";

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "Marked as read" });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.updateMany(
      { userId: req.user!._id, read: false },
      { read: true }
    );
    res.json({ message: "All marked as read" });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user!._id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};
