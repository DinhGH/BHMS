import express from "express";
import {
  getUsers,
  updateUserStatus,
  deleteUsers,
  addUser,
  getCurrentUser,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/me", getCurrentUser);

export default router;
