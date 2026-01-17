import { prisma } from "../lib/prisma.js";

export const getRoomsByBoardingHouse = async (req, res) => {
  try {
    const houseId = parseInt(req.params.houseId);

    if (isNaN(houseId)) {
      return res.status(400).json({
        message: "Invalid boarding house id",
      });
    }

    // (Optional) check house tồn tại
    const house = await prisma.boardingHouse.findUnique({
      where: { id: houseId },
      select: { id: true, name: true },
    });

    if (!house) {
      return res.status(404).json({
        message: "Boarding house not found",
      });
    }

    // Lấy rooms
    const rooms = await prisma.room.findMany({
      where: {
        houseId: houseId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(rooms);
  } catch (error) {
    console.error("Get rooms error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getRoomDetail = async (req, res) => {
  try {
    const roomId = Number(req.params.id);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        house: {
          select: { id: true, name: true },
        },

        // ✅ contract đang active
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

        // invoice mới nhất
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const activeContract = room.contracts[0] ?? null;
    const latestInvoice = room.invoices[0] ?? null;

    res.json({
      id: room.id,
      name: room.name,
      price: room.price,
      image: room.image,
      isLocked: room.isLocked,

      paymentStatus: latestInvoice?.status ?? "NO_INVOICE",

      tenant: activeContract?.tenant ?? null,
      moveInDate: activeContract?.moveInDate ?? null,
      contractEnd: activeContract?.contractEnd ?? null,
    });
  } catch (error) {
    console.error("Get room detail error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
