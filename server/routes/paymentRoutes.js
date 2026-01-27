import express from "express";
import { deletePayment, getPayments } from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", getPayments);
router.delete("/:id", deletePayment);

export default router;
