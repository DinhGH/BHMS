import express from "express";
import {
  getAllBoardingHouses,
  createBoardingHouse,
  updateBoardingHouse,
  checkBoardingHouseByName,
} from "../controllers/owner.boardinghouse.controller.js";
import { getRoomsByBoardingHouse } from "../controllers/owner.room.controller.js";
import { authOwner } from "../middlewares/owner.middleware.js";

const router = express.Router();
// router.use(authOwner);
router.get("/boarding-houses", getAllBoardingHouses);
router.get("/boarding-houses/check", checkBoardingHouseByName);
router.post("/boarding-houses", createBoardingHouse);
router.put("/boarding-houses/:id", updateBoardingHouse);
router.get("/boarding-houses/:houseId/rooms", getRoomsByBoardingHouse);

export default router;
