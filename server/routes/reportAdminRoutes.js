import express from "express";
import {
	createReportAdmin,
	listReportAdmins,
	updateReportAdmin,
	deleteReportAdmin,
} from "../controllers/reportAdminController.js";

const router = express.Router();

router.get("/", listReportAdmins);
router.post("/", createReportAdmin);
router.patch("/:id", updateReportAdmin);
router.delete("/:id", deleteReportAdmin);

export default router;
