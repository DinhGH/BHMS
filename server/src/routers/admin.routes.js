import express from "express";
import { getAdminDashboard, getCurrentUser } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/me", getCurrentUser);
router.get("/dashboard", getAdminDashboard);

export default router;
