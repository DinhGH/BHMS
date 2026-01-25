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
        Tenant: true,
        Invoice: {
          take: 1,
          orderBy: { createdAt: "desc" },
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

      electricFee: room.house.electricFee,
      waterFee: room.house.waterFee,

      tenants: room.Tenant,

      contract: {
        start: room.constractStart,
        end: room.constractEnd,
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
    const { houseId, name, price, image, constractStart, constractEnd } =
      req.body;

    if (!houseId || !name || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        price: Number(price),
        imageUrl: image || null,

        constractStart: constractStart ? new Date(constractStart) : null,

        constractEnd: constractEnd ? new Date(constractEnd) : null,

        // 🔥 BẮT BUỘC
        house: {
          connect: { id: Number(houseId) },
        },
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
      constractStart,
      constractEnd,
      isLocked,
    } = req.body;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
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

        constractStart: constractStart
          ? new Date(constractStart)
          : room.constractStart,

        constractEnd: constractEnd ? new Date(constractEnd) : room.constractEnd,

        isLocked: isLocked ?? room.isLocked,
      },
    });

    res.json(updatedRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update room failed" });
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

    // MySQL case-insensitive search (MySQL collation mặc định đã case-insensitive)
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
