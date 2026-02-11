import express from "express";
import {
  getUsers,
  updateUserStatus,
  updateUser,
  addUser,
  getCurrentUser,
  getAdminDashboard,
} from "../controllers/admin.controller.js";
const router = express.Router();

router.get("/me", getCurrentUser);
router.get("/dashboard", getAdminDashboard);

router.get("/", getUsers);

router.patch("/:id", updateUserStatus);
router.put("/:id", updateUser);

router.post("/add", addUser);

export default router;
