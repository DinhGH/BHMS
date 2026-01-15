import express from "express";
import { getAllBoardingHouses } from "../controllers/owner.controller.js";

const router = express.Router();

router.get("/boarding-houses", getAllBoardingHouses);

export default router;
