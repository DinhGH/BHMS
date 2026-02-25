import { prisma } from "../lib/prisma.js";
import {
  uploadSingle,
  deleteImage,
  deleteMultipleImages,
} from "../lib/uploadToCloudinary.js";

/* ================= GET ALL ================= */
export const getAllBoardingHouses = async (req, res) => {
  try {
    const ownerId = req.ownerId;
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

    const { name, address, electricFee, waterFee } = req.body;
    if (!name || !address) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const existed = await prisma.boardingHouse.findFirst({
      where: { name: name.trim(), ownerId },
    });

    if (existed) {
      console.log("❌ House already exists");
      return res.status(409).json({
        message: "Boarding house name already exists",
      });
    }

    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadSingle(req.file.buffer, "houses");
      } catch (uploadErr) {
        return res.status(400).json({
          message: "Failed to upload image: " + uploadErr.message,
        });
      }
    }

    const house = await prisma.boardingHouse.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        electricFee: Number(electricFee) || 0,
        waterFee: Number(waterFee) || 0,
        imageUrl,
        ownerId: ownerId,
      },
    });
    res.status(201).json(house);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};
/* ================= UPDATE ================= */
export const updateBoardingHouse = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const id = Number(req.params.id);
    const { name, address, electricFee, waterFee } = req.body;

    const house = await prisma.boardingHouse.findFirst({
      where: { id, ownerId },
    });

    if (!house) {
      return res.status(404).json({ message: "Not found" });
    }

    /* ================= IMAGE ================= */
    let imageUrl = house.imageUrl;

    if (req.file) {
      try {
        imageUrl = await uploadSingle(req.file.buffer, "houses");

        if (house.imageUrl) {
          await deleteImage(house.imageUrl);
        }
      } catch (uploadErr) {
        console.error("Image upload error:", uploadErr);
        return res.status(400).json({
          message: "Failed to upload image: " + uploadErr.message,
        });
      }
    }

    /* ================= VALIDATE PRICE ================= */
    const parsedElectric = Number(electricFee);
    const parsedWater = Number(waterFee);

    if (isNaN(parsedElectric) || parsedElectric <= 0) {
      return res.status(400).json({ message: "Electric fee must be > 0" });
    }

    if (isNaN(parsedWater) || parsedWater <= 0) {
      return res.status(400).json({ message: "Water fee must be > 0" });
    }

    /* ================= UPDATE DATA ================= */
    const updated = await prisma.boardingHouse.update({
      where: { id },
      data: {
        name: name?.trim() || house.name,
        address: address?.trim() || house.address,
        electricFee: parsedElectric,
        waterFee: parsedWater,
        imageUrl,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("updateBoardingHouse:", err);
    res.status(500).json({ message: "Server error: " + err.message });
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
    });

    if (!house) {
      return res.status(404).json({ message: "Not found" });
    }

    // 🔥 Lấy tất cả room thuộc house
    const rooms = await prisma.room.findMany({
      where: { houseId: house.id },
      select: { id: true },
    });

    const roomIds = rooms.map((r) => r.id);

    if (roomIds.length > 0) {
      // 🔥 Lấy invoice thuộc room
      const invoices = await prisma.invoice.findMany({
        where: { roomId: { in: roomIds } },
        select: { id: true },
      });

      const invoiceIds = invoices.map((i) => i.id);

      // 1️⃣ Xóa Payment
      if (invoiceIds.length > 0) {
        await prisma.payment.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
      }

      // 2️⃣ Xóa Invoice
      await prisma.invoice.deleteMany({
        where: { roomId: { in: roomIds } },
      });

      // 3️⃣ Xóa RentalContract
      await prisma.rentalContract.deleteMany({
        where: { roomId: { in: roomIds } },
      });

      // 4️⃣ Xóa Tenant
      await prisma.tenant.deleteMany({
        where: { roomId: { in: roomIds } },
      });

      // 5️⃣ Xóa RoomService
      await prisma.roomService.deleteMany({
        where: { roomId: { in: roomIds } },
      });

      // 6️⃣ Xóa Room
      await prisma.room.deleteMany({
        where: { houseId: house.id },
      });
    }

    // 7️⃣ Xóa BoardingHouse
    await prisma.boardingHouse.delete({
      where: { id: house.id },
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("deleteBoardingHouse:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};
