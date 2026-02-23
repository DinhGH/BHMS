import express from "express";
import {
  confirmStripeSessionPayment,
  getPayments,
  handleStripeWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

// Note: Webhook must use raw body (not JSON parsed)
// So we register it before express.json() middleware in index.js
// This route is registered in index.js with raw body handling

router.get("/", getPayments);
router.post("/confirm-session", confirmStripeSessionPayment);

export { handleStripeWebhook };
export default router;
