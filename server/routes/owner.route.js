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
import {
  sendInvoice,
  previewInvoice,
  createInvoiceAndSend,
  uploadInvoiceImage,
  createStripeSession,
  getInvoicesByRoom,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoice.controller.js";
import {
  getOwnerProfile,
  updateOwnerProfile,
  changePassword,
} from "../controllers/owner.profile.controller.js";
import { uploadOwnerImage } from "../controllers/owner.upload.controller.js";
import { getOwnerDashboard } from "../controllers/owner.dashboard.controller.js";

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
// import { makeInvoice } from "../controllers/invoice.controller.js";
import { authOwner } from "../middlewares/owner.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.use(authOwner);

// owner profile
router.get("/profile", getOwnerProfile);
router.get("/dashboard", getOwnerDashboard);
router.put("/profile", updateOwnerProfile);
router.put("/change-password", changePassword);
router.post("/uploads/image", upload.single("image"), uploadOwnerImage);

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
router.get("/rooms/:id/invoice-preview", previewInvoice);
router.post("/rooms/:id/invoice", sendInvoice);
router.get("/rooms/:id/invoices", getInvoicesByRoom);
router.put("/rooms/:roomId/invoices/:invoiceId", updateInvoice);
router.delete("/rooms/:roomId/invoices/:invoiceId", deleteInvoice);
// create invoice with optional QR upload
router.post(
  "/rooms/:id/invoice/create",
  upload.single("qr"),
  createInvoiceAndSend,
);

// upload or replace invoice image
router.post("/invoices/:id/upload", upload.single("image"), uploadInvoiceImage);

// stripe session
router.post("/stripe/create-session", createStripeSession);

//tenant
router.post("/rooms/:roomId/add-tenant", addTenantToRoom);
router.get("/tenants/search", searchAvailableTenants);

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
