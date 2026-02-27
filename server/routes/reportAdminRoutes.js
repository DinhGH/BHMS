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

<<<<<<< HEAD
router.get("/", listReportAdmins);
router.post("/", createReportAdmin);
router.patch("/:id", updateReportAdmin);
router.delete("/:id", deleteReportAdmin);
router.get("/:id", getReportAdmin);
router.patch("/:id/status", updateReportAdminStatus);
router.delete("/:id", deleteReportAdmin);
=======
router.get("/", requireAuth, listReportAdmins);
router.post("/", requireAuth, createReportAdmin);
// router.patch("/:id", updateReportAdmin);
router.get("/:id", requireAuth, getReportAdmin);
router.patch("/:id/status", requireAuth, requireAdmin, updateReportAdminStatus);
router.delete("/:id", requireAuth, deleteReportAdmin);
>>>>>>> b0f12bb313fffa8b9b2e643b133fdba89efcffb0
export default router;
