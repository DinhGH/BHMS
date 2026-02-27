import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { sendInvoiceEmail } from "../lib/mailer.js";
import { uploadSingle } from "../lib/uploadToCloudinary.js";

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

const createStripePaymentLink = async ({
  stripe,
  invoiceId,
  roomId,
  roomName,
  month,
  year,
  totalAmount,
}) => {
  const baseSuccessUrl =
    process.env.STRIPE_SUCCESS_URL || "http://localhost:5173/payment/success";
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
            name: `Invoice ${roomName} - ${month}/${year}`,
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      invoiceId: String(invoiceId),
      roomId: String(roomId),
    },
  });

  return session.url || null;
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
      paymentLink = await createStripePaymentLink({
        stripe,
        invoiceId: invoice.id,
        roomId: room.id,
        roomName: room.name,
        month,
        year,
        totalAmount,
      });
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
      include: {
        Room: {
          select: {
            id: true,
            name: true,
            electricMeterNow: true,
            electricMeterAfter: true,
            waterMeterNow: true,
            waterMeterAfter: true,
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
          },
        },
        Tenant: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
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
    let nextElectric = normalizeNumber(
      req.body?.electricCost,
      invoice.electricCost,
    );
    let nextWater = normalizeNumber(req.body?.waterCost, invoice.waterCost);
    const nextService = normalizeNumber(
      req.body?.serviceCost,
      invoice.serviceCost,
    );

    const hasElectricMeterAfter =
      req.body?.electricMeterAfter !== undefined &&
      req.body?.electricMeterAfter !== null &&
      req.body?.electricMeterAfter !== "";
    const hasWaterMeterAfter =
      req.body?.waterMeterAfter !== undefined &&
      req.body?.waterMeterAfter !== null &&
      req.body?.waterMeterAfter !== "";

    let roomMeterPatch = null;

    if (hasElectricMeterAfter || hasWaterMeterAfter) {
      const previousElectric = Number(
        invoice.Room?.electricMeterNow ?? invoice.Room?.electricMeterAfter ?? 0,
      );
      const previousWater = Number(
        invoice.Room?.waterMeterNow ?? invoice.Room?.waterMeterAfter ?? 0,
      );

      const nextElectricMeterAfter = hasElectricMeterAfter
        ? Number(req.body?.electricMeterAfter)
        : Number(invoice.Room?.electricMeterAfter ?? previousElectric);
      const nextWaterMeterAfter = hasWaterMeterAfter
        ? Number(req.body?.waterMeterAfter)
        : Number(invoice.Room?.waterMeterAfter ?? previousWater);

      if (
        Number.isNaN(nextElectricMeterAfter) ||
        nextElectricMeterAfter < previousElectric
      ) {
        return res.status(400).json({
          message: "Invalid electric meter reading",
        });
      }

      if (
        Number.isNaN(nextWaterMeterAfter) ||
        nextWaterMeterAfter < previousWater
      ) {
        return res.status(400).json({
          message: "Invalid water meter reading",
        });
      }

      const electricFee = Number(invoice.Room?.house?.electricFee ?? 0);
      const waterFee = Number(invoice.Room?.house?.waterFee ?? 0);

      nextElectric =
        Math.max(0, nextElectricMeterAfter - previousElectric) * electricFee;
      nextWater = Math.max(0, nextWaterMeterAfter - previousWater) * waterFee;

      roomMeterPatch = {
        electricMeterAfter: nextElectricMeterAfter,
        waterMeterAfter: nextWaterMeterAfter,
      };
    }

    if (
      Number(nextRoomPrice) < 0 ||
      Number(nextElectric) < 0 ||
      Number(nextWater) < 0 ||
      Number(nextService) < 0
    ) {
      return res.status(400).json({ message: "Costs cannot be negative" });
    }

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
    const statusChanged = invoice.status !== nextStatus;
    const nowPaid = nextStatus === "PAID" && invoice.status !== "PAID";

    const updated = await prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
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

      if (roomMeterPatch) {
        await tx.room.update({
          where: { id: roomId },
          data: roomMeterPatch,
        });
      }

      return updatedInvoice;
    });

    // Send email notification when status changes to PAID
    if (nowPaid) {
      try {
        const { sendPaidInvoiceNotifications } =
          await import("./paymentController.js");
        await sendPaidInvoiceNotifications({
          invoiceId: updated.id,
          extra: {
            paymentMethod: req.body?.paymentMethod || "Manual",
            paidAt: new Date(),
          },
        });
        console.log("INVOICE UPDATE: Paid notification email sent", {
          invoiceId: updated.id,
        });
      } catch (emailError) {
        console.error("INVOICE UPDATE: Failed to send paid email", {
          message: emailError?.message,
          invoiceId: updated.id,
        });
      }
    }

    let emailResent = false;
    if (invoice.Tenant?.email) {
      try {
        const stripe = getStripeClient();
        if (!stripe) {
          throw new Error("Stripe is not configured");
        }

        const paymentLink = await createStripePaymentLink({
          stripe,
          invoiceId: updated.id,
          roomId,
          roomName: invoice.Room?.name || `Room ${roomId}`,
          month: updated.month,
          year: updated.year,
          totalAmount: updated.totalAmount,
        });

        if (!paymentLink) {
          throw new Error("Stripe payment link is not available");
        }

        await sendInvoiceEmail({
          to: invoice.Tenant.email,
          tenantName: invoice.Tenant.fullName,
          roomName: invoice.Room?.name || `Room ${roomId}`,
          houseName: invoice.Room?.house?.name || "",
          month: updated.month,
          year: updated.year,
          roomPrice: updated.roomPrice,
          electricCost: updated.electricCost,
          waterCost: updated.waterCost,
          serviceCost: updated.serviceCost,
          totalAmount: updated.totalAmount,
          paymentLink,
          qrImageUrl: invoice.Room?.house?.owner?.qrImageUrl || null,
        });

        emailResent = true;
      } catch (emailError) {
        console.error("INVOICE UPDATE: Failed to resend invoice email", {
          message: emailError?.message,
          invoiceId: updated.id,
          tenantEmail: invoice.Tenant?.email,
        });
      }
    }

    res.json({
      message: emailResent
        ? "Invoice updated and email resent"
        : "Invoice updated",
      invoice: updated,
      emailResent,
    });
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

// ===== Backward-compatible exports for existing routes =====

export const previewInvoice = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (Number.isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const now = new Date();
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        house: true,
        roomServices: { include: { service: true } },
        RentalContract: {
          where: {
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
          include: { Tenant: true },
        },
      },
    });

    if (!room) return res.status(404).json({ message: "Room not found" });

    const numberOfTenants = room.RentalContract.length;
    if (numberOfTenants === 0) {
      return res.status(400).json({ message: "No active rental contract" });
    }

    const electricCost =
      (Number(room.electricMeterAfter || 0) -
        Number(room.electricMeterNow || 0)) *
      Number(room.house?.electricFee || 0);

    const waterCost =
      (Number(room.waterMeterAfter || 0) - Number(room.waterMeterNow || 0)) *
      Number(room.house?.waterFee || 0);

    const services = room.roomServices.map((rs) => {
      const quantity = Number(rs.quantity || 1);
      const unitPrice = Number(rs.service?.price || rs.price || 0);
      const total = Number(rs.totalPrice ?? unitPrice * quantity);

      return {
        name: rs.service?.name || "Service",
        price: unitPrice,
        quantity,
        total,
      };
    });

    const serviceCost = services.reduce(
      (sum, s) => sum + Number(s.total || 0),
      0,
    );
    const roomPrice = Number(room.price || 0);
    const total = roomPrice + electricCost + waterCost + serviceCost;

    return res.json({
      roomPrice,
      electricCost,
      waterCost,
      serviceCost,
      numberOfTenants,
      total,
      services,
    });
  } catch (err) {
    console.error("PREVIEW INVOICE ERROR:", err);
    return res
      .status(500)
      .json({ message: err.message || "Preview invoice failed" });
  }
};

export const sendInvoice = async (req, res) => makeInvoice(req, res);

export const createInvoiceAndSend = async (req, res) => makeInvoice(req, res);

export const uploadInvoiceImage = async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    if (Number.isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const imageUrl = await uploadSingle(req.file.buffer, "invoices");
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { imageUrl },
    });

    return res.json(invoice);
  } catch (err) {
    console.error("UPLOAD INVOICE IMAGE ERROR:", err);
    return res.status(500).json({ message: "Upload invoice image failed" });
  }
};

export const createStripeSession = async (req, res) => {
  try {
    const invoiceId = Number(req.body?.invoiceId);
    if (Number.isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        Room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    const url = await createStripePaymentLink({
      stripe,
      invoiceId: invoice.id,
      roomId: invoice.roomId,
      roomName: invoice.Room?.name || `Room ${invoice.roomId}`,
      month: invoice.month,
      year: invoice.year,
      totalAmount: invoice.totalAmount,
    });

    if (!url) {
      return res
        .status(500)
        .json({ message: "Stripe payment link is not available" });
    }

    return res.json({ url });
  } catch (err) {
    console.error("CREATE STRIPE SESSION ERROR:", err);
    return res
      .status(500)
      .json({ message: err.message || "Create Stripe session failed" });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const { method, amount } = req.body;

    const ALLOWED_METHODS = ["QR_TRANSFER", "CASH", "GATEWAY"];
    if (!ALLOWED_METHODS.includes(method)) {
      return res.status(400).json({
        message: `Invalid payment method. Allowed: ${ALLOWED_METHODS.join(", ")}`,
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payment: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    let proofImageUrl = null;
    if (req.file && method === "QR_TRANSFER") {
      proofImageUrl = await uploadSingle(req.file.buffer, "payment_proof");
    }

    const totalPaid = invoice.payment
      .filter((p) => p.confirmed)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const remaining = Number(invoice.totalAmount || 0) - totalPaid;
    const payAmount = amount ? Number(amount) : remaining;

    if (payAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than 0",
      });
    }

    if (payAmount > remaining) {
      return res.status(400).json({
        message: "Payment exceeds remaining amount",
        remaining,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        method,
        amount: payAmount,
        proofImage: proofImageUrl,
        confirmed: false,
      },
    });

    return res.json({
      message: "Payment submitted successfully",
      invoiceId,
      payment,
      remainingBefore: remaining,
      remainingAfter: remaining - payAmount,
      status: "PENDING_CONFIRMATION",
    });
  } catch (err) {
    console.error("CONFIRM PAYMENT ERROR:", err);
    return res.status(500).json({
      message: "Payment confirmation failed",
      error: err.message,
    });
  }
};

export const getInvoiceDetails = async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        Room: {
          include: {
            house: true,
          },
        },
        payment: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json(invoice);
  } catch (err) {
    console.error("GET INVOICE DETAILS ERROR:", err);
    return res.status(500).json({ message: "Fetch invoice details failed" });
  }
};
