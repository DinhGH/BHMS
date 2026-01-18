import { prisma } from "../lib/prisma.js";

export const getRoomsByBoardingHouse = async (req, res) => {
  try {
    const houseId = parseInt(req.params.houseId);
    if (isNaN(houseId)) {
      return res.status(400).json({ message: "Invalid boarding house id" });
    }

    const rooms = await prisma.room.findMany({
      where: { houseId },
      include: {
        contracts: {
          where: { active: true },
          include: {
            tenant: true,
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = rooms.map((room) => {
      const activeContract = room.contracts[0] || null;
      const latestInvoice = room.invoices[0] || null;

      const hasTenant = !!activeContract;

      let paymentStatus = "NO_TENANT";

      if (activeContract) {
        if (!latestInvoice) {
          paymentStatus = "NO_INVOICE";
        } else {
          paymentStatus = latestInvoice.status; // PENDING | PAID | OVERDUE
        }
      }

      return {
        id: room.id,
        name: room.name,
        image: room.image,
        price: room.price,
        currentOccupants: room.contracts.length,
        paymentStatus,
        contractEnd: activeContract?.contractEnd || null,
      };
    });

    return res.json(result);
  } catch (error) {
    console.error("Get rooms error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getRoomDetail = async (req, res) => {
  try {
    const roomId = Number(req.params.id);

    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        house: { select: { id: true, name: true } },
        contracts: {
          where: { active: true },
          take: 1,
          include: {
            tenant: {
              select: {
                id: true,
                user: {
                  select: {
                    fullName: true,
                    phone: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const activeContract = room.contracts[0] ?? null;
    const latestInvoice = room.invoices[0] ?? null;

    let paymentStatus = "NO_TENANT";
    if (activeContract) {
      paymentStatus = latestInvoice ? latestInvoice.status : "NO_INVOICE";
    }

    res.json({
      id: room.id,
      name: room.name,
      price: room.price,
      image: room.image,
      isLocked: room.isLocked,
      paymentStatus,
      tenant: activeContract?.tenant ?? null,
      moveInDate: activeContract?.moveInDate ?? null,
      contractEnd: activeContract?.contractEnd ?? null,
    });
  } catch (error) {
    console.error("Get room detail error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /owner/rooms
export const createRoom = async (req, res) => {
  try {
    const { houseId, name, price, image } = req.body;

    const room = await prisma.room.create({
      data: {
        houseId,
        name,
        price,
        image,
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
        contracts: {
          where: { active: true },
        },
        invoices: true,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // ❌ Có tenant (có hợp đồng active) → KHÔNG cho xóa
    if (room.contracts.length > 0) {
      return res.status(400).json({
        message: "Cannot delete room because it is currently rented",
      });
    }

    // ❌ Có invoice → KHÔNG cho xóa (optional nhưng nên có)
    if (room.invoices.length > 0) {
      return res.status(400).json({
        message: "Please delete all invoices before deleting this room",
      });
    }

    // ✅ OK → xóa phòng
    await prisma.room.delete({
      where: { id: roomId },
    });

    return res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
