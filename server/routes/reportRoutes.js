import express from "express";
import {
  listReports,
  getReportById,
  updateReportStatus,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/", listReports);
router.get("/:id", getReportById);
router.patch("/:id/status", updateReportStatus);

export default router;