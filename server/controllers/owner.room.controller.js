import { prisma } from "../lib/prisma.js";

export const getRoomsByBoardingHouse = async (req, res) => {
  try {
    const houseId = Number(req.params.houseId);
    const { minPrice, maxPrice, status, paymentStatus } = req.query;

    if (isNaN(houseId)) {
      return res.status(400).json({ message: "Invalid boarding house id" });
    }

    /* ===== DB FILTER ===== */
    const where = { houseId };

    if (minPrice && maxPrice) {
      where.price = {
        gte: Number(minPrice),
        lte: Number(maxPrice),
      };
    }

    if (status === "LOCKED") {
      where.status = "LOCKED";
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        rentalContracts: {
          where: { active: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        Invoice: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    /* ===== MAP ===== */
    let result = rooms.map((room) => {
      const contract = room.rentalContracts[0] ?? null;
      const invoice = room.Invoice[0] ?? null;

      let payment = "NO_TENANT";
      if (contract) {
        payment = invoice ? invoice.status : "NO_INVOICE";
      }

      return {
        id: room.id,
        name: room.name,
        imageUrl: room.imageUrl,
        price: room.price,
        status: room.status,
        currentOccupants: contract ? 1 : 0,
        paymentStatus: payment,
        contractEnd: contract?.endDate ?? null,
      };
    });

    /* ===== STATUS FILTER (TENANT BASED) ===== */
    if (status === "OCCUPIED") {
      result = result.filter(
        (r) => r.status !== "LOCKED" && r.currentOccupants > 0,
      );
    }

    if (status === "EMPTY") {
      result = result.filter(
        (r) => r.status !== "LOCKED" && r.currentOccupants === 0,
      );
    }

    /* ===== PAYMENT FILTER ===== */
    if (paymentStatus && paymentStatus !== "ALL") {
      result = result.filter((r) => r.paymentStatus === paymentStatus);
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRoomDetail = async (req, res) => {
  try {
    const roomId = Number(req.params.id);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        house: {
          select: {
            electricFee: true,
            waterFee: true,
          },
        },
        rentalContracts: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            tenant: true,
          },
        },
        Invoice: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const contract = room.rentalContracts[0] ?? null;
    const invoice = room.Invoice[0] ?? null;

    res.json({
      id: room.id,
      name: room.name,
      price: room.price,
      imageUrl: room.imageUrl,

      status: contract ? "OCCUPIED" : "EMPTY",

      electricMeter: room.electricMeter,
      waterMeter: room.waterMeter,

      electricFee: room.house.electricFee,
      waterFee: room.house.waterFee,

      tenant: contract
        ? {
            id: contract.tenant.id,
            fullName: contract.tenant.fullName,
            email: contract.tenant.email,
            phone: contract.tenant.phone,
            gender: contract.tenant.gender,
            imageUrl: contract.tenant.imageUrl,
          }
        : null,

      moveInDate: contract?.moveInDate ?? null,
      contractEnd: contract?.endDate ?? null,

      paymentStatus: invoice?.status ?? "NO_INVOICE",
      lastInvoice: invoice,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Get room detail failed" });
  }
};

// POST /owner/rooms
export const createRoom = async (req, res) => {
  try {
    const { houseId, name, price, imageUrl } = req.body;

    const room = await prisma.room.create({
      data: {
        houseId: Number(houseId),
        name,
        price: Number(price),
        imageUrl,
      },
    });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create room failed" });
  }
};

export const checkRoomName = async (req, res) => {
  try {
    const houseId = Number(req.query.houseId);
    const name = req.query.name?.trim();

    if (!houseId || !name) {
      return res.status(400).json({ exists: false });
    }

    const room = await prisma.room.findFirst({
      where: {
        houseId,
        name,
      },
    });

    return res.json({ exists: !!room });
  } catch (error) {
    console.error("Check room name error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const deleteRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        rentalContracts: {
          where: { active: true },
        },
        Invoice: true,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.rentalContracts.length > 0) {
      return res.status(400).json({
        message: "Cannot delete room because it is currently rented",
      });
    }

    if (room.Invoice.length > 0) {
      return res.status(400).json({
        message: "Please delete all invoices before deleting this room",
      });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    return res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const updateRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const { name, price, electricMeter, waterMeter, imageUrl } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        name: name.trim(),
        price: Number(price),
        electricMeter: Number(electricMeter) || 0,
        waterMeter: Number(waterMeter) || 0,
        imageUrl: imageUrl || null,
      },
    });

    return res.json(updatedRoom);
  } catch (error) {
    console.error("UPDATE ROOM ERROR:", error);
    return res.status(500).json({ message: "Update room failed" });
  }
};
