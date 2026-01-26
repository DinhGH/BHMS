import express from "express";
import { logout } from "../controllers/authController.js";

const router = express.Router();

//goi ham logout o controller
router.post("/logout", logout);

export default router;
