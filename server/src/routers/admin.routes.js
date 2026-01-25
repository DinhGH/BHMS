import express from "express";
import {
  getUsers,
  updateUserStatus,
  deleteUsers,
  updateUser,
  addUser,
  getCurrentUser,
} from "../controllers/admin.controller.js";

const router = express.Router();

// router.use(protectedRoute(["ADMIN"]));

router.get("/me", getCurrentUser);

router.get("/", getUsers);

router.patch("/:id", updateUserStatus);
router.put("/:id", updateUser);

router.delete("/", deleteUsers);

router.post("/add", addUser);

export default router;
