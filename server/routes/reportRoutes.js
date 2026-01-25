import express from "express";
import {
  listReports,
  createReport,
  getReportById,
  updateReport,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/", listReports);
router.post("/", createReport);
router.get("/:id", getReportById);
router.patch("/:id/status", updateReportStatus);
router.patch("/:id", updateReport);
router.delete("/:id", deleteReport);

export default router;