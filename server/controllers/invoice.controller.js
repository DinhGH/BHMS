import { prisma } from "../lib/prisma.js";
import { sendInvoiceStatusEmail } from "../lib/mailer.js";

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

export const updateInvoice = async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    if (Number.isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }

    const {
      roomId,
      tenantId,
      roomPrice,
      electricCost,
      waterCost,
      serviceCost,
      totalAmount,
      month,
      year,
      status,
    } = req.body || {};

    if (status && !["PENDING", "PAID", "OVERDUE"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const data = {};
    if (roomId !== undefined) data.roomId = Number(roomId);
    if (tenantId !== undefined) data.tenantId = Number(tenantId);
    if (roomPrice !== undefined) data.roomPrice = Number(roomPrice);
    if (electricCost !== undefined) data.electricCost = Number(electricCost);
    if (waterCost !== undefined) data.waterCost = Number(waterCost);
    if (serviceCost !== undefined) data.serviceCost = Number(serviceCost);
    if (totalAmount !== undefined) data.totalAmount = Number(totalAmount);
    if (month !== undefined) data.month = Number(month);
    if (year !== undefined) data.year = Number(year);
    if (status !== undefined) data.status = status;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data,
      select: {
        id: true,
        month: true,
        year: true,
        totalAmount: true,
        status: true,
        tenant: {
          select: {
            email: true,
            fullName: true,
          },
        },
        room: {
          select: {
            name: true,
            house: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    let emailResult = null;
    const statusChanged = status && status !== existing.status;
    if (statusChanged && ["PAID", "OVERDUE"].includes(status)) {
      try {
        const roomLabel = updated.room?.name
          ? `Phòng ${updated.room.name}${updated.room.house?.name ? ` - ${updated.room.house.name}` : ""}`
          : "";

        emailResult = await sendInvoiceStatusEmail({
          to: updated.tenant?.email,
          tenantName: updated.tenant?.fullName,
          roomLabel,
          month: updated.month,
          year: updated.year,
          status,
          totalAmount: updated.totalAmount,
        });
      } catch (emailError) {
        console.error("sendInvoiceStatusEmail error:", emailError);
        emailResult = { sent: false, error: "Email failed" };
      }
    }

    return res.json({
      message: "Invoice updated successfully",
      invoice: updated,
      email: emailResult,
    });
  } catch (error) {
    console.error("UPDATE INVOICE ERROR:", error);
    return res.status(500).json({ message: "Update invoice failed" });
  }
};
