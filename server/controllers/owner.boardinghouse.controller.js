import { prisma } from "../lib/prisma.js";

/* ================= GET ALL ================= */
export const getAllBoardingHouses = async (req, res) => {
  try {
    const ownerId = 3; // req.ownerId;
    const search = (req.query.search || "").replace(/\s+/g, "").toLowerCase();

    const houses = await prisma.boardingHouse.findMany({
      where: {
        ownerId: ownerId,
      },
      include: {
        rooms: {
          include: {
            Tenant: true,
            Invoice: {
              orderBy: { createdAt: "desc" },
              take: 1, // invoice mới nhất
              include: {
                payment: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = houses
      .filter((h) => {
        const name = h.name.replace(/\s+/g, "").toLowerCase();
        const address = h.address.replace(/\s+/g, "").toLowerCase();
        return name.includes(search) || address.includes(search);
      })
      .map((h) => {
        let occupied = 0;
        let available = 0;

        h.rooms.forEach((room) => {
          const hasTenant = room.Tenant.length > 0;
          const latestInvoice = room.Invoice[0];

          const isPaidInvoice =
            latestInvoice &&
            latestInvoice.status === "PAID" &&
            latestInvoice.payment.some((p) => p.confirmed === true);

          // 🔥 CHỈ OCCUPIED KHI: có người + đã thanh toán
          const isOccupied = hasTenant && isPaidInvoice;

          if (isOccupied) {
            occupied++;
          } else {
            available++;
          }
        });

        return {
          id: h.id,
          name: h.name,
          address: h.address,
          totalRooms: h.rooms.length,
          occupied,
          available,
          imageUrl: h.imageUrl,
        };
      });

    res.json(result);
  } catch (err) {
    console.error("getAllBoardingHouses:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CREATE ================= */
export const createBoardingHouse = async (req, res) => {
  try {
    const ownerId = req.ownerId;
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
        electricFee: Number(electricFee),
        waterFee: Number(waterFee),
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
    const ownerId = req.ownerId;
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
