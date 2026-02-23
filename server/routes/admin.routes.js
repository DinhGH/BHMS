import express from "express";
import {
  getUsers,
  updateUserStatus,
  updateUser,
  addUser,
  getCurrentUser,
  getAdminDashboard,
  deleteUsers,
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.get("/me", getCurrentUser);
router.get("/dashboard", getAdminDashboard);

router.get("/", getUsers);

router.patch("/:id", updateUserStatus);
router.put("/:id", updateUser);

router.delete("/", requireAuth, deleteUsers);

router.post("/add", addUser);

export default router;
