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
import {
  getOwnerContracts,
  getOwnerContractDetail,
  getOwnerContractInvoices,
  getOwnerContractStayHistory,
  getOwnerContractOptions,
  createOwnerContract,
  updateOwnerContract,
  deleteOwnerContract,
} from "../controllers/owner.contract.controller.js";
import { makeInvoice } from "../controllers/invoice.controller.js";
import { authOwner } from "../middlewares/owner.middleware.js";

const router = express.Router();
router.use(authOwner);
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

// contracts
router.get("/contracts", getOwnerContracts);
router.get("/contracts/options", getOwnerContractOptions);
router.get("/contracts/:id", getOwnerContractDetail);
router.get("/contracts/:id/invoices", getOwnerContractInvoices);
router.get("/contracts/:id/stay-history", getOwnerContractStayHistory);
router.post("/contracts", createOwnerContract);
router.put("/contracts/:id", updateOwnerContract);
router.delete("/contracts/:id", deleteOwnerContract);

export default router;
