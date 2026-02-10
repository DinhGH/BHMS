import { prisma } from "../lib/prisma.js";
//create invoice for a room
import { uploadSingle } from "../lib/uploadToCloudinary.js";
import { sendInvoiceEmail } from "../utils/sendInvoiceEmail.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});
export const previewInvoice = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
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
      (room.electricMeterAfter - room.electricMeterNow) *
      room.house.electricFee;

    const waterCost =
      (room.waterMeterAfter - room.waterMeterNow) * room.house.waterFee;

    const serviceCost = room.roomServices.reduce(
      (sum, s) => sum + s.service.price * (s.quantity || 1),
      0,
    );

    const roomPrice = room.price;
    const total = roomPrice + electricCost + waterCost + serviceCost;

    res.json({
      roomPrice,
      electricCost,
      waterCost,
      serviceCost,
      numberOfTenants,
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const sendInvoice = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const now = new Date();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        house: true,
        RentalContract: {
          where: {
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
          include: { Tenant: true },
        },
        roomServices: { include: { service: true } },
      },
    });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Require active rental contract
    if (room.RentalContract.length === 0) {
      return res.status(400).json({ message: "No active rental contract" });
    }

    const tenant = room.RentalContract[0].Tenant;

    const electricCost =
      (room.electricMeterAfter - room.electricMeterNow) *
      room.house.electricFee;

    const waterCost =
      (room.waterMeterAfter - room.waterMeterNow) * room.house.waterFee;

    const serviceCost = room.roomServices.reduce(
      (sum, s) => sum + s.service.price * (s.quantity || 1),
      0,
    );

    const roomPrice = room.price;
    const totalAmount = roomPrice + electricCost + waterCost + serviceCost;

    const invoice = await prisma.invoice.create({
      data: {
        roomId,
        tenantId: tenant.id,
        roomPrice,
        electricCost,
        waterCost,
        serviceCost,
        totalAmount,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    });

    await sendInvoiceEmail(tenant.email, invoice);

    res.json({ message: "Invoice sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createStripeSession = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || "usd",
            product_data: { name: `Invoice #${invoice.id}` },
            unit_amount: Math.round(invoice.totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: { invoiceId: String(invoice.id) },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
// Upload invoice image
export const uploadInvoiceImage = async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const imageUrl = await uploadSingle(req.file.buffer, "invoices");

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { imageUrl },
    });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Upload invoice image failed" });
  }
};
export const createInvoiceAndSend = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
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

    // 🎯 Require active rental contract
    if (room.RentalContract.length === 0) {
      return res.status(400).json({ message: "No active rental contract" });
    }

    const tenant = room.RentalContract[0].Tenant;

    // 💡 TÍNH TIỀN
    const electricCost =
      (room.electricMeterAfter - room.electricMeterNow) *
      room.house.electricFee;

    const waterCost =
      (room.waterMeterAfter - room.waterMeterNow) * room.house.waterFee;

    const serviceCost = room.roomServices.reduce(
      (sum, s) => sum + s.totalPrice,
      0,
    );

    const roomPrice = room.price;
    const totalAmount = roomPrice + electricCost + waterCost + serviceCost;

    // 📷 Upload QR
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadSingle(req.file.buffer, "invoice_qr");
    }

    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    // 🧾 TẠO INVOICE (or update if exists for this month/year)
    let invoice = await prisma.invoice.findUnique({
      where: {
        roomId_month_year: { roomId, month, year },
      },
    });

    if (invoice) {
      // Update existing invoice
      invoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          roomPrice,
          electricCost,
          waterCost,
          serviceCost,
          totalAmount,
          imageUrl: imageUrl || invoice.imageUrl,
        },
      });
    } else {
      // Create new invoice
      invoice = await prisma.invoice.create({
        data: {
          roomId,
          tenantId: tenant.id,
          roomPrice,
          electricCost,
          waterCost,
          serviceCost,
          totalAmount,
          month,
          year,
          imageUrl,
        },
      });
    }

    // 📧 GỬI EMAIL (skip silently if email not configured)
    let warning = null;
    const minStripeAmount = 5000; // $0.50 minimum in cents
    const amountInCents = Math.round(totalAmount * 100);

    if (amountInCents < minStripeAmount) {
      warning =
        "Invoice amount is too small for Stripe payment. Tenant will receive QR code for bank transfer or cash payment only.";
    }

    try {
      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        await sendInvoiceEmail(tenant.email, invoice);
      } else {
        console.warn("Email not configured; skipping invoice email");
      }
    } catch (emailErr) {
      console.error(
        "Failed to send invoice email:",
        emailErr.message || emailErr,
      );
      // Don't fail the whole request for email errors
    }

    const response = {
      message: "Invoice created/updated & sent successfully",
      invoiceId: invoice.id,
    };
    if (warning) response.warning = warning;

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create invoice failed" });
  }
};

// 💰 Confirm payment by QR or Cash
export const confirmPayment = async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const { method } = req.body; // "QR_TRANSFER" or "CASH"

    if (!["QR_TRANSFER", "CASH"].includes(method)) {
      return res.status(400).json({
        message: 'Invalid payment method. Use "QR_TRANSFER" or "CASH"',
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (req.file && method === "QR_TRANSFER") {
      proofImageUrl = await uploadSingle(req.file.buffer, "payment_proof");
    }

    // Do NOT auto-mark invoice as PAID here. The tenant chooses QR or CASH
    // from the email/payment modal — we only record the chosen method so the
    // owner/admin can review and confirm later.

    // Create or update payment record: only update method/proof, keep confirmed=false
    const payment = await prisma.payment.upsert({
      where: { invoiceId },
      update: {
        method,
        proofImage: proofImageUrl || undefined,
        // keep confirmed false so admin can verify (unless you want auto-confirm)
        confirmed: false,
        // do not set paymentDate yet
        paymentDate: null,
        amount: invoice.totalAmount,
      },
      create: {
        invoiceId,
        method,
        amount: invoice.totalAmount,
        proofImage: proofImageUrl,
        confirmed: false,
      },
    });

    res.json({
      message: `Payment method updated to ${
        method === "QR_TRANSFER" ? "QR Transfer" : "Cash"
      }`,
      invoiceId,
      status: "PENDING",
      payment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment confirmation failed" });
  }
};

// 📋 Get invoice details (for tenant payment page)
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

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch invoice details failed" });
  }
};
