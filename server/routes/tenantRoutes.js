import express from "express";
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../controllers/tenantController.js";

const router = express.Router();

router.get("/", getTenants);
router.get("/:id", getTenant);
router.post("/", createTenant);
router.patch("/:id", updateTenant);
router.delete("/:id", deleteTenant);

export default router;
