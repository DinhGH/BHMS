import express from "express";
import { createReportAdmin } from "../controllers/reportAdminController.js";

const router = express.Router();

router.post("/", createReportAdmin);

export default router;
