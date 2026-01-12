import express from "express";
import { getCurrentUser } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/me", getCurrentUser);

export default router;
