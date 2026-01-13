import { Router } from "express";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notificationsController.js";

const router = Router();

// Get all notifications for a user
router.get("/:userId", getNotifications);

// Mark notification as read
router.patch("/:notificationId/read", markAsRead);

export default router;
