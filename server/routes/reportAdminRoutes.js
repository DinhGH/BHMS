import express from "express";
import { createReportAdmin, listReportAdmins } from "../controllers/reportAdminController.js";

const router = express.Router();

router.get("/", listReportAdmins);
router.post("/", createReportAdmin);

export default router;
