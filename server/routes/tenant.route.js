import express from "express";
import { getTenants } from "../controllers/tenant.controller.js";
import { getTenantById } from "../controllers/tenant.controller.js"; // ✅ ADD THIS

const router = express.Router();

router.get("/", getTenants);
router.get("/:id", getTenantById); // ✅ ADD THIS


export default router;
