import { Router } from "express";
import {
  getTenantProfile,
  getTenantRoom,
} from "../controllers/tenantController.js";

const router = Router();

// Tenant profile and basic info
router.get("/:userId/profile", getTenantProfile);

// Tenant's current room
router.get("/:userId/room", getTenantRoom);

export default router;
