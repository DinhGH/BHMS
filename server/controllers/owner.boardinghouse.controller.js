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
export const createBoardingHouse = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const { name, address, electricFee, waterFee, services } = req.body;

    if (!name || !address) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const existed = await prisma.boardingHouse.findFirst({
      where: {
        name: name.trim(),
        ownerId,
      },
    });

    if (existed) {
      return res.status(409).json({
        message: "Boarding house name already exists",
      });
    }

    const newHouse = await prisma.boardingHouse.create({
      data: {
        name: name.trim(),
        address,
        electricFee: Number(electricFee),
        waterFee: Number(waterFee),
        services: services ?? null,
        ownerId,
      },
    });

    res.status(201).json(newHouse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBoardingHouse = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const { id } = req.params;
    const { name, address, electricFee, waterFee, services } = req.body;

    const house = await prisma.boardingHouse.findFirst({
      where: { id: Number(id), ownerId },
    });

    if (!house) {
      return res.status(404).json({
        message: "Boarding house not found or no permission",
      });
    }

    if (name && name.trim() !== house.name) {
      const existed = await prisma.boardingHouse.findFirst({
        where: {
          name: name.trim(),
          ownerId,
          NOT: { id: Number(id) },
        },
      });

      if (existed) {
        return res.status(409).json({
          message: "Boarding house name already exists",
        });
      }
    }

    const updatedHouse = await prisma.boardingHouse.update({
      where: { id: Number(id) },
      data: {
        name: name?.trim(),
        address,
        electricFee: Number(electricFee),
        waterFee: Number(waterFee),
        services,
      },
    });

    res.json(updatedHouse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkBoardingHouseByName = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const { name } = req.query;

    if (!name) return res.json(null);

    const house = await prisma.boardingHouse.findFirst({
      where: {
        name: name.trim(),
        ownerId,
      },
    });

    res.json(house || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
