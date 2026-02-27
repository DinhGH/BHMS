import express from "express";
import {
  createReportAdmin,
  listReportAdmins,
  getReportAdmin,
  updateReportAdminStatus,
  deleteReportAdmin,
  updateReportAdmin,
} from "../controllers/reportAdminController.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listReportAdmins);
router.post("/", requireAuth, createReportAdmin);
router.patch("/:id", requireAuth, updateReportAdmin);
router.delete("/:id", requireAuth, deleteReportAdmin);
router.get("/:id", requireAuth, getReportAdmin);
router.patch("/:id/status", requireAuth, updateReportAdminStatus);
router.delete("/:id", requireAuth, deleteReportAdmin);
export default router;
