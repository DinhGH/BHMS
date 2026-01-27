import express from "express";
import { updateInvoice } from "../controllers/invoice.controller.js";

const router = express.Router();

router.patch("/:id", updateInvoice);

export default router;
