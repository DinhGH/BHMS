import express from "express";
import {
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMyProfile,
  updateMyProfile,
  getMyNotifications,
  markMyNotificationsRead,
} from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.get("/profile", requireAuth, getMyProfile);
router.put("/profile", requireAuth, updateMyProfile);
router.get("/notifications", requireAuth, getMyNotifications);
router.patch("/notifications/read-all", requireAuth, markMyNotificationsRead);

export default router;
