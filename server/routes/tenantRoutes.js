import express from "express";
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../controllers/tenantController.js";
import {
  confirmPayment,
  getInvoiceDetails,
} from "../controllers/invoice.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", getTenants);
router.get("/:id", getTenant);
router.post("/", createTenant);
router.patch("/:id", updateTenant);
router.delete("/:id", deleteTenant);

// Invoice payment endpoints (public - for tenants)
router.get("/invoices/:id", getInvoiceDetails);
router.post(
  "/invoices/:id/confirm-payment",
  upload.single("proof"),
  confirmPayment,
);

export default router;
