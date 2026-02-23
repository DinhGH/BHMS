import { prisma } from "../lib/prisma.js";

/* =====================================================
   GET ROOMS BY BOARDING HOUSE
   ===================================================== */
export const getRoomsByBoardingHouse = async (req, res) => {
  try {
    const houseId = Number(req.params.houseId);
    const { minPrice, maxPrice, status, paymentStatus } = req.query;

    if (isNaN(houseId)) {
      return res.status(400).json({ message: "Invalid boarding house id" });
    }

    /* ===== WHERE ===== */
    const where = { houseId };

    if (minPrice && maxPrice) {
      where.price = {
        gte: Number(minPrice),
        lte: Number(maxPrice),
      };
    }

    if (status === "LOCKED") {
      where.isLocked = true;
    }

    /* ===== QUERY ===== */
    const rooms = await prisma.room.findMany({
      where,
      include: {
        Tenant: true,
        Invoice: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    /* ===== MAP ===== */
    let result = rooms.map((room) => {
      const tenantCount = room.Tenant.length;
      const invoice = room.Invoice[0] ?? null;

      let roomStatus = "EMPTY";
      if (room.isLocked) roomStatus = "LOCKED";
      else if (tenantCount > 0) roomStatus = "OCCUPIED";

      return {
        id: room.id,
        name: room.name,
        imageUrl: room.imageUrl,
        price: room.price,

        status: roomStatus,
        currentOccupants: tenantCount,

        paymentStatus:
          tenantCount > 0 ? (invoice?.status ?? "NO_INVOICE") : "NO_TENANT",

        month: invoice?.month ?? null,
        year: invoice?.year ?? null,
      };
    });

    /* ===== STATUS FILTER ===== */
    if (status === "OCCUPIED") {
      result = result.filter((r) => r.status === "OCCUPIED");
    }

    if (status === "EMPTY") {
      result = result.filter((r) => r.status === "EMPTY");
    }

    /* ===== PAYMENT FILTER ===== */
    if (paymentStatus && paymentStatus !== "ALL") {
      result = result.filter((r) => r.paymentStatus === paymentStatus);
    }

    return res.json(result);
  } catch (err) {
    console.error("GET ROOMS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
/* =====================================================
   GET ROOM DETAIL
   ===================================================== */
export const getRoomDetail = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        house: {
          select: {
            electricFee: true,
            waterFee: true,
          },
        },
        Tenant: {
          orderBy: { id: "asc" },
        },
        Invoice: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        roomServices: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const invoice = room.Invoice[0] ?? null;

    res.json({
      id: room.id,
      name: room.name,
      price: room.price,
      imageUrl: room.imageUrl,

      status: room.isLocked
        ? "LOCKED"
        : room.Tenant.length > 0
          ? "OCCUPIED"
          : "EMPTY",

      electricMeterNow: room.electricMeterNow,
      electricMeterAfter: room.electricMeterAfter,
      waterMeterNow: room.waterMeterNow,
      waterMeterAfter: room.waterMeterAfter,

      electricFee: room.house?.electricFee ?? null,
      waterFee: room.house?.waterFee ?? null,

      tenants: room.Tenant,

      contract: {
        start: room.contractStart,
        end: room.contractEnd,
      },

      paymentStatus: invoice?.status ?? "NO_INVOICE",
      lastInvoice: invoice,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Get room detail failed" });
  }
};

/* =====================================================
   CREATE ROOM
   ===================================================== */
export const createRoom = async (req, res) => {
  try {
    const { houseId, name, price, image, contractStart, contractEnd } =
      req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedHouseId =
      houseId === undefined || houseId === null || houseId === ""
        ? null
        : Number(houseId);

    if (parsedHouseId !== null && isNaN(parsedHouseId)) {
      return res.status(400).json({ message: "Invalid boarding house id" });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        price: Number(price),
        imageUrl: image || null,

        contractStart: contractStart ? new Date(contractStart) : null,

        contractEnd: contractEnd ? new Date(contractEnd) : null,

        ...(parsedHouseId
          ? {
              house: {
                connect: { id: parsedHouseId },
              },
            }
          : { houseId: null }),
      },
    });

    return res.json(room);
  } catch (err) {
    console.error("CREATE ROOM ERROR:", err);
    return res.status(500).json({ message: "Create room failed" });
  }
};

/* =====================================================
   CHECK ROOM NAME
   ===================================================== */
export const checkRoomName = async (req, res) => {
  try {
    const houseId = Number(req.query.houseId);
    const name = req.query.name?.trim();

    if (!houseId || !name) {
      return res.json({ exists: false });
    }

    const room = await prisma.room.findFirst({
      where: { houseId, name },
    });

    return res.json({ exists: !!room });
  } catch (err) {
    console.error("CHECK ROOM NAME ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   DELETE ROOM
   ===================================================== */
export const deleteRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        Invoice: true,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.Invoice.length > 0) {
      return res.status(400).json({
        message: "Please delete invoices before deleting this room",
      });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    return res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("DELETE ROOM ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   UPDATE ROOM
   ===================================================== */
export const updateRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const {
      name,
      price,
      imageUrl,
      electricMeterNow,
      electricMeterAfter,
      waterMeterNow,
      waterMeterAfter,
      contractStart,
      contractEnd,
      isLocked,
      houseId,
    } = req.body;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    let nextHouseId = undefined;
    if (houseId !== undefined) {
      if (houseId === null || houseId === "") {
        nextHouseId = null;
      } else {
        const parsedHouseId = Number(houseId);
        if (isNaN(parsedHouseId)) {
          return res.status(400).json({ message: "Invalid boarding house id" });
        }

        if (room.houseId && room.houseId !== parsedHouseId) {
          return res.status(400).json({
            message: "Room already assigned to another boarding house",
          });
        }

        nextHouseId = parsedHouseId;
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        name: name?.trim() ?? room.name,
        price: price !== undefined ? Number(price) : room.price,
        imageUrl: imageUrl ?? room.imageUrl,

        electricMeterNow:
          electricMeterNow !== undefined
            ? Number(electricMeterNow)
            : room.electricMeterNow,

        electricMeterAfter:
          electricMeterAfter !== undefined
            ? Number(electricMeterAfter)
            : room.electricMeterAfter,

        waterMeterNow:
          waterMeterNow !== undefined
            ? Number(waterMeterNow)
            : room.waterMeterNow,

        waterMeterAfter:
          waterMeterAfter !== undefined
            ? Number(waterMeterAfter)
            : room.waterMeterAfter,

        contractStart: contractStart
          ? new Date(contractStart)
          : room.contractStart,

        contractEnd: contractEnd ? new Date(contractEnd) : room.contractEnd,

        isLocked: isLocked ?? room.isLocked,

        ...(nextHouseId !== undefined ? { houseId: nextHouseId } : {}),
      },
    });

    res.json(updatedRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update room failed" });
  }
};

/* =====================================================
   GET ALL ROOMS (OWNER)
   ===================================================== */
export const getAllRooms = async (req, res) => {
  try {
    const { unassigned } = req.query;

    const where = {};
    if (unassigned === "true") {
      where.houseId = null;
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        Tenant: true,
        Invoice: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = rooms.map((room) => {
      const tenantCount = room.Tenant.length;
      const invoice = room.Invoice[0] ?? null;

      let roomStatus = "EMPTY";
      if (room.isLocked) roomStatus = "LOCKED";
      else if (tenantCount > 0) roomStatus = "OCCUPIED";

      return {
        id: room.id,
        name: room.name,
        imageUrl: room.imageUrl,
        price: room.price,
        houseId: room.house?.id ?? null,
        houseName: room.house?.name ?? null,
        status: roomStatus,
        currentOccupants: tenantCount,
        paymentStatus:
          tenantCount > 0 ? (invoice?.status ?? "NO_INVOICE") : "NO_TENANT",
        month: invoice?.month ?? null,
        year: invoice?.year ?? null,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error("GET ALL ROOMS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
/* =====================================================
    ADD TENANT TO ROOM
    ===================================================== */
export const addTenantToRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // 1️⃣ Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { Tenant: true },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // 2️⃣ Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(tenantId) },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // 3️⃣ Check if tenant is already in THIS room
    if (tenant.roomId === roomId) {
      return res.status(400).json({
        message: "This tenant is already in this room",
      });
    }

    // 4️⃣ Assign/Reassign tenant to room
    const updatedTenant = await prisma.tenant.update({
      where: { id: Number(tenantId) },
      data: {
        roomId: roomId,
      },
    });

    const message = tenant.roomId
      ? `Tenant moved from another room to this room successfully`
      : `Tenant added to room successfully`;

    res.json({
      message,
      tenant: updatedTenant,
    });
  } catch (err) {
    console.error("Add tenant error:", err);
    res.status(500).json({ message: "Add tenant failed" });
  }
};
export const searchAvailableTenants = async (req, res) => {
  try {
    const { query } = req.query;

    const where = {};

    if (query && query.trim()) {
      where.OR = [
        {
          fullName: {
            contains: query.trim(),
          },
        },
        {
          email: {
            contains: query.trim(),
          },
        },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        age: true,
        gender: true,
        roomId: true,
      },
      take: 10,
      orderBy: {
        fullName: "asc",
      },
    });

    res.json(tenants);
  } catch (err) {
    console.error("Search tenants error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* =====================================================
    REMOVE TENANT FROM ROOM
    ===================================================== */
export const removeTenantFromRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const tenantId = Number(req.params.tenantId);

    if (isNaN(roomId) || isNaN(tenantId)) {
      return res.status(400).json({ message: "Invalid roomId or tenantId" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.roomId !== roomId) {
      return res.status(400).json({ message: "Tenant not in this room" });
    }

    // 1️⃣ Remove tenant khỏi phòng
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        roomId: null,
      },
    });

    // 2️⃣ End rental contract (nếu có)
    await prisma.rentalContract.updateMany({
      where: {
        roomId,
        tenantId,
        endDate: null,
      },
      data: {
        endDate: new Date(),
      },
    });

    res.json({ message: "Tenant removed from room successfully" });
  } catch (err) {
    console.error("removeTenantFromRoom:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchTenantsInRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const { query } = req.query;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const where = {
      roomId: roomId,
    };

    if (query && query.trim()) {
      where.OR = [
        { fullName: { contains: query.trim() } },
        { email: { contains: query.trim() } },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        age: true,
        gender: true,
      },
      orderBy: { fullName: "asc" },
      take: 10,
    });

    res.json(tenants);
  } catch (err) {
    console.error("searchTenantsInRoom error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* =====================================================
   ADD TO ROOM
   ===================================================== */
export const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    res.json(services);
  } catch (err) {
    console.error("getAllServices:", err);
    res.status(500).json({ message: "Fetch services failed" });
  }
};

// owner.room.controller.js

export const addServiceToRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const { serviceId, price, quantity } = req.body;

    // Validation
    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    if (!serviceId || isNaN(Number(serviceId))) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    if (
      price === undefined ||
      price === null ||
      isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({ message: "Invalid price" });
    }

    // Check room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check service exists
    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (!service.isActive) {
      return res.status(400).json({ message: "This service is not active" });
    }

    // Validate quantity based on priceType
    let finalQuantity = 1; // Default for FIXED
    if (service.priceType === "UNIT_BASED") {
      if (!quantity || quantity < 1) {
        return res.status(400).json({
          message: "Quantity is required for unit-based services",
        });
      }
      finalQuantity = Number(quantity);
    }

    // Calculate total price
    const totalPrice = Number(price) * finalQuantity;

    // Use upsert - update if exists, create if not
    const roomService = await prisma.roomService.upsert({
      where: {
        roomId_serviceId: {
          roomId,
          serviceId: Number(serviceId),
        },
      },
      update: {
        price: Number(price),
        quantity: finalQuantity,
        totalPrice: totalPrice,
      },
      create: {
        roomId,
        serviceId: Number(serviceId),
        price: Number(price),
        quantity: finalQuantity,
        totalPrice: totalPrice,
      },
      include: {
        service: true,
      },
    });

    res.json(roomService);
  } catch (err) {
    console.error("addServiceToRoom:", err);
    res.status(500).json({
      message: "Add service failed",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const getServicesOfRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);

    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const services = await prisma.roomService.findMany({
      where: { roomId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            priceType: true,
            unit: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(services);
  } catch (err) {
    console.error("getServicesOfRoom:", err);
    res.status(500).json({ message: "Fetch services failed" });
  }
};

export const updateServiceQuantity = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const serviceId = Number(req.params.serviceId);
    const { quantity, price } = req.body;

    if (!roomId || !serviceId) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const roomService = await prisma.roomService.findUnique({
      where: {
        roomId_serviceId: { roomId, serviceId },
      },
      include: { Service: true },
    });

    if (!roomService) {
      return res.status(404).json({
        message: "Service not found in this room",
      });
    }

    // Only allow quantity update for UNIT_BASED services
    if (roomService.service.priceType !== "UNIT_BASED" && quantity) {
      return res.status(400).json({
        message: "Cannot update quantity for fixed-price services",
      });
    }

    const finalPrice = price !== undefined ? Number(price) : roomService.price;
    const finalQuantity =
      quantity !== undefined ? Number(quantity) : roomService.quantity;

    if (finalQuantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const updated = await prisma.roomService.update({
      where: {
        roomId_serviceId: { roomId, serviceId },
      },
      data: {
        price: finalPrice,
        quantity: finalQuantity,
        totalPrice: finalPrice * finalQuantity,
      },
      include: { Service: true },
    });

    res.json(updated);
  } catch (err) {
    console.error("updateServiceQuantity:", err);
    res.status(500).json({ message: "Update service failed" });
  }
};

export const removeServiceFromRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const serviceId = Number(req.params.serviceId);

    if (!roomId || !serviceId) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const existed = await prisma.roomService.findUnique({
      where: {
        roomId_serviceId: { roomId, serviceId },
      },
    });

    if (!existed) {
      return res
        .status(404)
        .json({ message: "Service not found in this room" });
    }

    await prisma.roomService.delete({
      where: {
        roomId_serviceId: { roomId, serviceId },
      },
    });

    res.json({ message: "Service removed from room" });
  } catch (err) {
    console.error("removeServiceFromRoom:", err);
    res.status(500).json({ message: "Remove service failed" });
  }
};
