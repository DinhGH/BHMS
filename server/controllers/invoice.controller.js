import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { sendInvoiceEmail } from "../lib/mailer.js";

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is missing");
    return null;
  }
  return new Stripe(secretKey, { apiVersion: "2023-10-16" });
};

const normalizeNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const ensureSuccessUrlHasSessionId = (url) => {
  if (!url) return url;
  if (url.includes("{CHECKOUT_SESSION_ID}")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}session_id={CHECKOUT_SESSION_ID}`;
};

export const makeInvoice = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) {
      console.warn("MAKE INVOICE 400: Invalid room id", {
        roomId: req.params.id,
      });
      return res.status(400).json({ message: "Invalid room id" });
    }

    const currentElectric = Number(req.body?.electricMeterAfter);
    const currentWater = Number(req.body?.waterMeterAfter);

    if (Number.isNaN(currentElectric) || Number.isNaN(currentWater)) {
      console.warn("MAKE INVOICE 400: Missing current meter readings", {
        roomId,
        body: req.body,
      });
      return res.status(400).json({
        message: "Current electric and water meter readings are required",
      });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // 1️⃣ Lấy phòng + nhà + dịch vụ
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        house: {
          select: {
            name: true,
            electricFee: true,
            waterFee: true,
            owner: {
              select: {
                qrImageUrl: true,
              },
            },
          },
        },
        roomServices: true,
        Tenant: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // 2️⃣ Tenant đại diện: ưu tiên tenant đầu tiên trong phòng; fallback hợp đồng active
    const representativeTenant = room.Tenant?.[0] ?? null;

    let activeContract = null;
    if (!representativeTenant) {
      activeContract = await prisma.rentalContract.findFirst({
        where: {
          roomId,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        include: {
          Tenant: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const billingTenantId =
      representativeTenant?.id ?? activeContract?.tenantId;
    const billingTenantName =
      representativeTenant?.fullName ?? activeContract?.Tenant?.fullName ?? "";
    const billingTenantEmail =
      representativeTenant?.email ?? activeContract?.Tenant?.email ?? "";

    if (!billingTenantId) {
      console.warn(
        "MAKE INVOICE 400: No tenant in room and no active contract",
        {
          roomId,
          now: now.toISOString(),
        },
      );
      return res.status(400).json({
        message: "Room has no tenant to bill",
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
      console.warn("MAKE INVOICE 400: Invoice already exists", {
        roomId,
        month,
        year,
      });
      return res.status(400).json({
        message: "Invoice already exists for this month",
      });
    }

    // 4️⃣ Tính tiền
    const previousElectric = Number(
      room.electricMeterAfter ?? room.electricMeterNow ?? 0,
    );
    const previousWater = Number(
      room.waterMeterAfter ?? room.waterMeterNow ?? 0,
    );

    if (currentElectric < previousElectric || currentWater < previousWater) {
      console.warn("MAKE INVOICE 400: Meter reading decreased", {
        roomId,
        previousElectric,
        currentElectric,
        previousWater,
        currentWater,
      });
      return res.status(400).json({
        message: "Current meter readings must be greater than last readings",
      });
    }

    const electricUsage = currentElectric - previousElectric;
    const waterUsage = currentWater - previousWater;

    const electricFee = Number(room.house?.electricFee ?? 0);
    const waterFee = Number(room.house?.waterFee ?? 0);

    const electricCost = electricUsage * electricFee;
    const waterCost = waterUsage * waterFee;

    const serviceCost = room.roomServices.reduce((sum, s) => {
      const total = s.totalPrice ?? Number(s.price) * (s.quantity ?? 1);
      return sum + total;
    }, 0);

    const totalAmount = room.price + electricCost + waterCost + serviceCost;

    if (totalAmount <= 0) {
      console.warn("MAKE INVOICE 400: Total amount is not valid", {
        roomId,
        totalAmount,
      });
      return res.status(400).json({
        message: "Total amount must be greater than 0",
      });
    }

    // 5️⃣ Tạo invoice
    const invoice = await prisma.invoice.create({
      data: {
        roomId: room.id,
        tenantId: billingTenantId,
        roomPrice: room.price,
        electricCost,
        waterCost,
        serviceCost,
        totalAmount,
        month,
        year,
      },
    });
    const stripe = getStripeClient();
    if (!stripe) {
      console.error("MAKE INVOICE 500: Stripe not configured", {
        roomId,
        invoiceId: invoice.id,
      });
      await prisma.invoice.delete({ where: { id: invoice.id } });
      return res.status(500).json({
        message: "Stripe is not configured. Please set STRIPE_SECRET_KEY.",
      });
    }

    let paymentLink = null;
    try {
      const baseSuccessUrl =
        process.env.STRIPE_SUCCESS_URL ||
        "http://localhost:5173/payment/success";
      const successUrl = ensureSuccessUrlHasSessionId(baseSuccessUrl);
      const cancelUrl =
        process.env.STRIPE_CANCEL_URL || "http://localhost:5173/payment/cancel";

      const stripeAmount = Math.round(Number(totalAmount) * 100);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: stripeAmount,
              product_data: {
                name: `Invoice ${room.name} - ${month}/${year}`,
              },
            },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          invoiceId: String(invoice.id),
          roomId: String(room.id),
        },
      });

      paymentLink = session.url || null;
    } catch (stripeError) {
      console.error("CREATE STRIPE SESSION ERROR:", {
        message: stripeError?.message,
        stack: stripeError?.stack,
        roomId,
        invoiceId: invoice.id,
      });
      await prisma.invoice.delete({ where: { id: invoice.id } });
      return res.status(500).json({
        message: "Failed to create Stripe payment link",
      });
    }

    if (!paymentLink) {
      console.error("MAKE INVOICE 500: Stripe payment link empty", {
        roomId,
        invoiceId: invoice.id,
      });
      await prisma.invoice.delete({ where: { id: invoice.id } });
      return res.status(500).json({
        message: "Stripe payment link is not available",
      });
    }

    await prisma.room.update({
      where: { id: room.id },
      data: {
        electricMeterNow: previousElectric,
        electricMeterAfter: currentElectric,
        waterMeterNow: previousWater,
        waterMeterAfter: currentWater,
      },
    });

    try {
      const recipientEmail = billingTenantEmail;

      if (recipientEmail) {
        await sendInvoiceEmail({
          to: recipientEmail,
          tenantName: billingTenantName,
          roomName: room.name,
          houseName: room.house?.name || "",
          month,
          year,
          roomPrice: room.price,
          electricCost,
          waterCost,
          serviceCost,
          totalAmount,
          paymentLink,
          qrImageUrl: room.house?.owner?.qrImageUrl || null,
        });
      }
    } catch (mailError) {
      console.error("SEND INVOICE EMAIL ERROR:", {
        message: mailError?.message,
        stack: mailError?.stack,
        roomId,
        invoiceId: invoice.id,
        recipient: billingTenantEmail,
      });
    }

    return res.json({
      message: "Invoice created successfully",
      invoice,
      paymentLink,
    });
  } catch (error) {
    console.error("MAKE INVOICE ERROR:", {
      message: error?.message,
      stack: error?.stack,
      roomId: req.params?.id,
    });
    return res.status(500).json({ message: "Create invoice failed" });
  }
};

export const getInvoicesByRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const invoices = await prisma.invoice.findMany({
      where: { roomId },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        roomId: true,
        tenantId: true,
        roomPrice: true,
        electricCost: true,
        waterCost: true,
        serviceCost: true,
        totalAmount: true,
        status: true,
        month: true,
        year: true,
        createdAt: true,
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error("GET INVOICES BY ROOM ERROR:", error);
    res.status(500).json({ message: "Fetch invoices failed" });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const invoiceId = Number(req.params.invoiceId);

    if (isNaN(roomId) || isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid roomId or invoiceId" });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.roomId !== roomId) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const nextMonth = normalizeNumber(req.body?.month, invoice.month);
    const nextYear = normalizeNumber(req.body?.year, invoice.year);

    if (!nextMonth || nextMonth < 1 || nextMonth > 12) {
      return res.status(400).json({ message: "Invalid month" });
    }

    if (!nextYear || nextYear < 2000) {
      return res.status(400).json({ message: "Invalid year" });
    }

    if (nextMonth !== invoice.month || nextYear !== invoice.year) {
      const exists = await prisma.invoice.findFirst({
        where: {
          roomId,
          month: nextMonth,
          year: nextYear,
          NOT: { id: invoiceId },
        },
      });

      if (exists) {
        return res
          .status(400)
          .json({ message: "Invoice already exists for this month" });
      }
    }

    const nextRoomPrice = normalizeNumber(
      req.body?.roomPrice,
      invoice.roomPrice,
    );
    const nextElectric = normalizeNumber(
      req.body?.electricCost,
      invoice.electricCost,
    );
    const nextWater = normalizeNumber(req.body?.waterCost, invoice.waterCost);
    const nextService = normalizeNumber(
      req.body?.serviceCost,
      invoice.serviceCost,
    );

    const totalAmount =
      Number(nextRoomPrice || 0) +
      Number(nextElectric || 0) +
      Number(nextWater || 0) +
      Number(nextService || 0);

    if (totalAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Total amount must be greater than 0" });
    }

    const nextStatus = req.body?.status || invoice.status;

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        roomPrice: nextRoomPrice,
        electricCost: nextElectric,
        waterCost: nextWater,
        serviceCost: nextService,
        totalAmount,
        month: nextMonth,
        year: nextYear,
        status: nextStatus,
      },
    });

    res.json({ message: "Invoice updated", invoice: updated });
  } catch (error) {
    console.error("UPDATE INVOICE ERROR:", error);
    res.status(500).json({ message: "Update invoice failed" });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const invoiceId = Number(req.params.invoiceId);

    if (isNaN(roomId) || isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid roomId or invoiceId" });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.roomId !== roomId) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { invoiceId } }),
      prisma.invoice.delete({ where: { id: invoiceId } }),
    ]);

    res.json({ message: "Invoice deleted" });
  } catch (error) {
    console.error("DELETE INVOICE ERROR:", error);
    res.status(500).json({ message: "Delete invoice failed" });
  }
};
