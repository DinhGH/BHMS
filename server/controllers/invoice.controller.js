import { prisma } from "../lib/prisma.js";

export const makeInvoice = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // 1️⃣ Lấy phòng + nhà + dịch vụ
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        house: true,
        roomServices: true,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // 2️⃣ Lấy hợp đồng đang active
    const activeContract = await prisma.rentalContract.findFirst({
      where: {
        roomId,
        active: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!activeContract) {
      return res.status(400).json({
        message: "Room has no active rental contract",
      });
    }

    // 3️⃣ Check invoice tháng này đã tồn tại chưa
    const existedInvoice = await prisma.invoice.findFirst({
      where: {
        roomId,
        month,
        year,
      },
    });

    if (existedInvoice) {
      return res.status(400).json({
        message: "Invoice already exists for this month",
      });
    }

    // 4️⃣ Tính tiền
    const electricCost = room.electricMeter * room.house.electricFee;
    const waterCost = room.waterMeter * room.house.waterFee;

    const serviceCost = room.roomServices.reduce((sum, s) => sum + s.price, 0);

    const totalAmount = room.price + electricCost + waterCost + serviceCost;

    // 5️⃣ Tạo invoice
    const invoice = await prisma.invoice.create({
      data: {
        roomId: room.id,
        tenantId: activeContract.tenantId,
        roomPrice: room.price,
        electricCost,
        waterCost,
        serviceCost,
        totalAmount,
        month,
        year,
      },
    });

    return res.json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error("MAKE INVOICE ERROR:", error);
    return res.status(500).json({ message: "Create invoice failed" });
  }
};
