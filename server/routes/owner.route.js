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
  getAllRooms,
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

import {
  makeInvoice,
  getInvoicesByRoom,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoice.controller.js";

// import { makeInvoice } from "../controllers/invoice.controller.js";
import {
  getOwnerProfile,
  updateOwnerProfile,
  changePassword,
} from "../controllers/owner.profile.controller.js";
import { uploadOwnerImage } from "../controllers/owner.upload.controller.js";
import { getOwnerDashboard } from "../controllers/owner.dashboard.controller.js";

import { authOwner } from "../middlewares/owner.middleware.js";
import { uploadImage } from "../middlewares/upload.middleware.js";

const router = express.Router();
router.use(authOwner);

// Profile routes
router.get("/profile", getOwnerProfile);
router.get("/dashboard", getOwnerDashboard);
router.put("/profile", updateOwnerProfile);
router.post("/profile/change-password", changePassword);
router.post("/uploads/image", uploadImage.single("image"), uploadOwnerImage);
router.get("/boarding-houses", getAllBoardingHouses);
router.get("/boarding-houses/check", checkBoardingHouseByName);
router.post("/boarding-houses", createBoardingHouse);
router.put("/boarding-houses/:id", updateBoardingHouse);
router.get("/boarding-houses/:houseId/rooms", getRoomsByBoardingHouse);
router.delete("/boarding-houses", deleteBoardingHouseByName);

router.post("/rooms", createRoom);
router.get("/rooms", getAllRooms);
// router.get("/rooms/check-name", checkRoomName);
router.get("/rooms/:id", getRoomDetail);
router.delete("/rooms/:id", deleteRoom);
router.put("/rooms/:id", updateRoom);
router.post("/rooms/:id/invoice", makeInvoice);
router.get("/rooms/:id/invoices", getInvoicesByRoom);
router.put("/rooms/:roomId/invoices/:invoiceId", updateInvoice);
router.delete("/rooms/:roomId/invoices/:invoiceId", deleteInvoice);
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
