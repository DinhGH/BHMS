import { prisma } from "../lib/prisma.js";

export const getAllBoardingHouses = async (req, res) => {
  try {
    const rawSearch = req.query.search || "";

    const search = rawSearch.replace(/\s+/g, "").toLowerCase();

    const houses = await prisma.boardingHouse.findMany({
      include: {
        rooms: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const filtered = houses.filter((house) => {
      const name = house.name.replace(/\s+/g, "").toLowerCase();
      const address = house.address.replace(/\s+/g, "").toLowerCase();

      return name.includes(search) || address.includes(search);
    });

    const result = filtered.map((house) => {
      const totalRooms = house.rooms.length;
      const occupied = house.rooms.filter((r) => !r.isLocked).length;
      const available = house.rooms.filter((r) => r.isLocked).length;

      return {
        id: house.id,
        name: house.name,
        address: house.address,
        totalRooms,
        occupied,
        available,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("getAllBoardingHouses error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
