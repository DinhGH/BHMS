import express from "express";
import {
  getAllBoardingHouses,
  createBoardingHouse,
  updateBoardingHouse,
  checkBoardingHouseByName,
  deleteBoardingHouseByName,
} from "../controllers/owner.boardinghouse.controller.js";
import {
  getRoomsByBoardingHouse,
  getRoomDetail,
  createRoom,
  checkRoomName,
  deleteRoom,
  updateRoom,
  addTenantToRoom,
  searchAvailableTenants,
} from "../controllers/owner.room.controller.js";
import { makeInvoice } from "../controllers/invoice.controller.js";
import { authOwner } from "../middlewares/owner.middleware.js";

const router = express.Router();
// router.use(authOwner);
router.get("/boarding-houses", getAllBoardingHouses);
router.get("/boarding-houses/check", checkBoardingHouseByName);
router.post("/boarding-houses", createBoardingHouse);
router.put("/boarding-houses/:id", updateBoardingHouse);
router.get("/boarding-houses/:houseId/rooms", getRoomsByBoardingHouse);
router.delete("/boarding-houses", deleteBoardingHouseByName);

router.post("/rooms", createRoom);
// router.get("/rooms/check-name", checkRoomName);
router.get("/rooms/:id", getRoomDetail);
router.delete("/rooms/:id", deleteRoom);
router.put("/rooms/:id", updateRoom);
router.post("/rooms/:id/invoice", makeInvoice);
router.post("/rooms/:roomId/add-tenant", addTenantToRoom);
router.get("/tenants/search", searchAvailableTenants);

export default router;
