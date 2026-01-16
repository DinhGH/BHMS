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
