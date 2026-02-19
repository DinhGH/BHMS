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
  removeTenantFromRoom,
  searchTenantsInRoom,
  addServiceToRoom,
  getServicesOfRoom,
  removeServiceFromRoom,
  getAllServices,
  updateServiceQuantity,
} from "../controllers/owner.room.controller.js";
import { makeInvoice } from "../controllers/invoice.controller.js";
import {
  getOwnerProfile,
  updateOwnerProfile,
  changePassword,
} from "../controllers/owner.profile.controller.js";
import { authOwner } from "../middlewares/owner.middleware.js";

const router = express.Router();
router.use(authOwner);

// Profile routes
router.get("/profile", getOwnerProfile);
router.put("/profile", updateOwnerProfile);
router.post("/profile/change-password", changePassword);
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
router.delete("/rooms/:roomId/tenants/:tenantId", removeTenantFromRoom);
router.get("/rooms/:roomId/tenants/search", searchTenantsInRoom);
//service
router.get("/services", getAllServices);
router.post("/rooms/:roomId/services", addServiceToRoom);
router.get("/rooms/:roomId/services", getServicesOfRoom);
router.put("/rooms/:roomId/services/:serviceId", updateServiceQuantity);
router.delete("/rooms/:roomId/services/:serviceId", removeServiceFromRoom);

export default router;
