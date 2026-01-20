import { prisma } from "../lib/prisma.js";

/* ================= GET ALL ================= */
export const getAllBoardingHouses = async (req, res) => {
  try {
    const search = (req.query.search || "").replace(/\s+/g, "").toLowerCase();

    const houses = await prisma.boardingHouse.findMany({
      include: { rooms: true },
      orderBy: { createdAt: "desc" },
    });

    const result = houses
      .filter((h) => {
        const name = h.name.replace(/\s+/g, "").toLowerCase();
        const address = h.address.replace(/\s+/g, "").toLowerCase();
        return name.includes(search) || address.includes(search);
      })
      .map((h) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        totalRooms: h.rooms.length,
        occupied: h.rooms.filter((r) => r.status === "OCCUPIED").length,
        available: h.rooms.filter((r) => r.status === "EMPTY").length,
        imageUrl: h.imageUrl,
      }));

    res.json(result);
  } catch (err) {
    console.error("getAllBoardingHouses:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CREATE ================= */
export const createBoardingHouse = async (req, res) => {
  try {
    const ownerId = 1;
    const { name, address, electricFee, waterFee, imageUrl } = req.body;

    if (!name || !address) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const existed = await prisma.boardingHouse.findFirst({
      where: { name: name.trim(), ownerId },
    });

    if (existed) {
      return res.status(409).json({
        message: "Boarding house name already exists",
      });
    }

    const house = await prisma.boardingHouse.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        electricFee: Number(electricFee) || 0,
        waterFee: Number(waterFee) || 0,
        imageUrl: imageUrl || null,
        ownerId,
      },
    });

    res.status(201).json(house);
  } catch (err) {
    console.error("createBoardingHouse:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE ================= */
export const updateBoardingHouse = async (req, res) => {
  try {
    const ownerId = 1;
    const id = Number(req.params.id);
    const { name, address, electricFee, waterFee, imageUrl } = req.body;

    const house = await prisma.boardingHouse.findFirst({
      where: { id, ownerId },
    });

    if (!house) {
      return res.status(404).json({ message: "Not found" });
    }

    const updated = await prisma.boardingHouse.update({
      where: { id },
      data: {
        name: name?.trim(),
        address: address?.trim(),
        electricFee:
          electricFee !== undefined ? Number(electricFee) : house.electricFee,
        waterFee: waterFee !== undefined ? Number(waterFee) : house.waterFee,
        imageUrl: imageUrl ?? house.imageUrl,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("updateBoardingHouse:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CHECK BY NAME ================= */
export const checkBoardingHouseByName = async (req, res) => {
  try {
    const ownerId = 1;
    const { name } = req.query;

    if (!name) return res.json(null);

    const house = await prisma.boardingHouse.findFirst({
      where: { name: name.trim(), ownerId },
    });

    res.json(house);
  } catch (err) {
    console.error("checkBoardingHouse:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE ================= */
export const deleteBoardingHouseByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Name required" });
    }

    const house = await prisma.boardingHouse.findFirst({
      where: { name: name.trim() },
      include: { rooms: true },
    });

    if (!house) {
      return res.status(404).json({ message: "Not found" });
    }

    // ❗ Xoá phòng trước (tránh P2003)
    await prisma.room.deleteMany({
      where: { houseId: house.id },
    });

    await prisma.boardingHouse.delete({
      where: { id: house.id },
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("deleteBoardingHouse:", err);
    res.status(500).json({ message: "Server error" });
  }
};
