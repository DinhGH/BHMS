import express from "express";
<<<<<<< HEAD
import { logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/logout", logout);
=======
import { register, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
>>>>>>> i-sprint1-1-admin-owner

export default router;
