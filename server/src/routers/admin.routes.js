import express from "express";
import {
  getUsers,
  updateUserStatus,
  deleteUsers,
  addUser,
  getCurrentUser,
} from "../controllers/admin.controller.js";

const router = express.Router();

// router.use(protectedRoute(["ADMIN"]));

router.get("/me", getCurrentUser);

router.get("/", getUsers);

router.patch("/:id", updateUserStatus);

router.delete("/", deleteUsers);

router.post("/add", addUser);

export default router;
