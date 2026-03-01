import express from "express";
import {
  confirmStripeSessionPayment,
  getPayments,
  handleStripeWebhook,
  updatePaymentByOwner,
} from "../controllers/paymentController.js";
import upload from "../middlewares/upload.middleware.js";
import { authOwner } from "../middlewares/owner.middleware.js";

const router = express.Router();

// Note: Webhook must use raw body (not JSON parsed)
// So we register it before express.json() middleware in index.js
// This route is registered in index.js with raw body handling

router.get("/", getPayments);
router.post("/confirm-session", confirmStripeSessionPayment);
router.patch("/:id", authOwner, upload.single("proof"), updatePaymentByOwner);

export { handleStripeWebhook };
export default router;
