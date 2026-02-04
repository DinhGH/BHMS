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
  updateContract,
  addTenantToRoom,
  searchAvailableTenants,
  removeTenantFromRoom,
  searchTenantsInRoom,
  addServiceToRoom,
  getServicesOfRoom,
  removeServiceFromRoom,
  getAllServices,
  updateServiceQuantity,
  updateRoom,
} from "../controllers/owner.room.controller.js";
import { makeInvoice } from "../controllers/invoice.controller.js";
import { authOwner } from "../middlewares/owner.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.use(authOwner);

//boarding house
router.get("/boarding-houses", getAllBoardingHouses);
router.get("/boarding-houses/check", checkBoardingHouseByName);
router.post("/boarding-houses", upload.single("image"), createBoardingHouse);
router.put("/boarding-houses/:id", upload.single("image"), updateBoardingHouse);
router.get("/boarding-houses/:houseId/rooms", getRoomsByBoardingHouse);
router.delete("/boarding-houses", deleteBoardingHouseByName);

//room
// router.get("/rooms/check-name", checkRoomName);
router.get("/rooms/:id", getRoomDetail);
router.post("/rooms", upload.single("image"), createRoom);
router.delete("/rooms/:id", deleteRoom);
router.put("/rooms/:id/details", upload.single("image"), updateRoom);
router.put("/rooms/:id/contract", updateContract);
router.delete("/rooms/:roomId/tenants/:tenantId", removeTenantFromRoom);
router.get("/rooms/:roomId/tenants/search", searchTenantsInRoom);

//invoice
router.post("/rooms/:id/invoice", makeInvoice);
//tenant
router.post("/rooms/:roomId/add-tenant", addTenantToRoom);
router.get("/tenants/search", searchAvailableTenants);

//service
router.get("/services", getAllServices);
router.post("/rooms/:roomId/services", addServiceToRoom);
router.get("/rooms/:roomId/services", getServicesOfRoom);
router.put("/rooms/:roomId/services/:serviceId", updateServiceQuantity);
router.delete("/rooms/:roomId/services/:serviceId", removeServiceFromRoom);
export default router;
