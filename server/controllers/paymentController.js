import { getAllPayments } from "../services/paymentService.js";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { sendInvoicePaidEmail } from "../lib/mailer.js";

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is missing");
    return null;
  }
  return new Stripe(secretKey, { apiVersion: "2023-10-16" });
};

const toDateFromMaybeUnix = (value) => {
  if (!value && value !== 0) return null;
  const num = Number(value);
  if (!Number.isNaN(num) && String(value).length <= 10) {
    return new Date(num * 1000);
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const toServiceItems = (roomServices = []) => {
  return (roomServices || []).map((item) => {
    const quantity = Number(item?.quantity ?? 1) || 1;
    const unitPrice = Number(item?.price || 0);
    const totalPrice = Number(item?.totalPrice ?? unitPrice * quantity);

    return {
      serviceName: item?.service?.name || "Service",
      quantity,
      unitPrice,
      totalPrice,
    };
  });
};

export const sendPaidInvoiceNotifications = async ({
  invoiceId,
  extra = {},
}) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(invoiceId) },
    select: {
      id: true,
      month: true,
      year: true,
      roomPrice: true,
      electricCost: true,
      waterCost: true,
      serviceCost: true,
      totalAmount: true,
      Tenant: {
        select: {
          fullName: true,
          email: true,
        },
      },
      Room: {
        select: {
          name: true,
          house: {
            select: {
              name: true,
            },
          },
          roomServices: {
            select: {
              price: true,
              quantity: true,
              totalPrice: true,
              service: {
                select: {
                  name: true,
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
      },
    },
  });

  if (!invoice) {
    return { sentCount: 0, recipients: [] };
  }

  const recipientMap = new Map();
  const addRecipient = (fullName, email) => {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    if (!normalizedEmail) return;
    if (!recipientMap.has(normalizedEmail)) {
      recipientMap.set(normalizedEmail, {
        fullName: fullName || "Tenant",
        email: normalizedEmail,
      });
    }
  };

  (invoice?.Room?.Tenant || []).forEach((tenant) =>
    addRecipient(tenant.fullName, tenant.email),
  );
  addRecipient(invoice?.Tenant?.fullName, invoice?.Tenant?.email);

  const recipients = Array.from(recipientMap.values());
  if (!recipients.length) {
    return { sentCount: 0, recipients: [] };
  }

  const paidAtDate = toDateFromMaybeUnix(
    extra?.paidAt || extra?.sessionCreated,
  );
  const serviceItems = toServiceItems(invoice?.Room?.roomServices || []);

  let sentCount = 0;
  for (const recipient of recipients) {
    try {
      await sendInvoicePaidEmail({
        to: recipient.email,
        tenantName: recipient.fullName,
        invoiceId: invoice.id,
        roomName: invoice?.Room?.name || "N/A",
        houseName: invoice?.Room?.house?.name || "",
        month: invoice.month,
        year: invoice.year,
        roomPrice: invoice.roomPrice,
        electricCost: invoice.electricCost,
        waterCost: invoice.waterCost,
        serviceCost: invoice.serviceCost,
        serviceItems,
        totalAmount: invoice.totalAmount,
        currency: extra?.currency || "USD",
        paidAt: paidAtDate,
        paymentMethod: extra?.paymentMethod || "Stripe",
        transactionId: extra?.paymentIntentId || extra?.sessionId,
      });
      sentCount += 1;
    } catch (error) {
      console.error("SEND PAID EMAIL ERROR:", {
        message: error?.message,
        invoiceId: invoice.id,
        recipient: recipient.email,
      });
    }
  }

  return { sentCount, recipients: recipients.map((r) => r.email) };
};

const markInvoiceAsPaid = async (invoiceId, source, extra = {}) => {
  const parsedInvoiceId = Number(invoiceId);

  if (!parsedInvoiceId || Number.isNaN(parsedInvoiceId)) {
    throw new Error("Invalid invoiceId");
  }

  const existing = await prisma.invoice.findUnique({
    where: { id: parsedInvoiceId },
    select: { id: true, status: true, roomId: true },
  });

  if (!existing) {
    throw new Error(`Invoice #${parsedInvoiceId} not found`);
  }

  const updateResult = await prisma.invoice.updateMany({
    where: {
      id: parsedInvoiceId,
      status: { not: "PAID" },
    },
    data: { status: "PAID" },
  });

  if (updateResult.count === 0) {
    console.log("PAYMENT STATUS: Invoice already PAID", {
      invoiceId: parsedInvoiceId,
      source,
      ...extra,
    });
    return { alreadyPaid: true, invoice: existing };
  }

  const updated = await prisma.invoice.findUnique({
    where: { id: parsedInvoiceId },
    select: { id: true, status: true, roomId: true },
  });

  console.log("PAYMENT STATUS: Invoice marked PAID", {
    invoiceId: parsedInvoiceId,
    source,
    roomId: updated.roomId,
    ...extra,
  });

  const emailResult = await sendPaidInvoiceNotifications({
    invoiceId: parsedInvoiceId,
    extra,
  });

  console.log("PAYMENT STATUS: Paid notification emails processed", {
    invoiceId: parsedInvoiceId,
    sentCount: emailResult.sentCount,
    recipients: emailResult.recipients,
  });

  return { alreadyPaid: false, invoice: updated };
};

export async function getPayments(req, res) {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
}

/**
 * Stripe Webhook Handler
 * Updates invoice status to PAID when Stripe charge succeeds
 */
export async function handleStripeWebhook(req, res) {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      console.error("WEBHOOK 500: Stripe not configured");
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      console.warn("WEBHOOK 400: Missing stripe-signature header");
      return res.status(400).json({ message: "Missing stripe-signature" });
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      console.error("WEBHOOK: STRIPE_WEBHOOK_SECRET is not set");
      return res.status(500).json({ message: "Webhook secret not configured" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret,
      );
    } catch (err) {
      console.error("WEBHOOK 400: Signature verification failed", {
        message: err.message,
      });
      return res
        .status(400)
        .json({ message: "Webhook signature verification failed" });
    }

    console.log("WEBHOOK EVENT RECEIVED:", { type: event.type });

    // Handle successful checkout session completion
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const invoiceId = Number(session.metadata?.invoiceId);

      if (!invoiceId || isNaN(invoiceId)) {
        console.warn("WEBHOOK: Missing or invalid invoiceId in metadata", {
          metadata: session.metadata,
        });
        return res.status(400).json({ message: "Invalid invoice metadata" });
      }

      await markInvoiceAsPaid(invoiceId, "stripe_webhook", {
        eventType: event.type,
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        currency: session.currency,
        paymentMethod: "Stripe",
        paidAt: session.created,
      });
    }

    // Return 200 to acknowledge receipt of event
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("WEBHOOK ERROR:", {
      message: error?.message,
      stack: error?.stack,
    });
    return res.status(500).json({ message: "Webhook processing failed" });
  }
}

export async function confirmStripeSessionPayment(req, res) {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const sessionId = req.body?.sessionId || req.query?.session_id;

    if (!sessionId) {
      return res.status(400).json({ message: "Missing sessionId" });
    }

    const session = await stripe.checkout.sessions.retrieve(String(sessionId));

    if (!session) {
      return res.status(404).json({ message: "Checkout session not found" });
    }

    const isPaid =
      session.payment_status === "paid" || session.status === "complete";

    if (!isPaid) {
      return res.status(400).json({
        message: "Payment is not completed yet",
        paymentStatus: session.payment_status,
        checkoutStatus: session.status,
      });
    }

    const invoiceId = Number(session.metadata?.invoiceId);
    if (!invoiceId || Number.isNaN(invoiceId)) {
      return res
        .status(400)
        .json({ message: "Missing invoice metadata in checkout session" });
    }

    const result = await markInvoiceAsPaid(invoiceId, "success_page_confirm", {
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      currency: session.currency,
      paymentMethod: "Stripe",
      paidAt: session.created,
    });

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
        month: true,
        year: true,
        roomPrice: true,
        electricCost: true,
        waterCost: true,
        serviceCost: true,
        totalAmount: true,
        createdAt: true,
        Tenant: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        Room: {
          select: {
            name: true,
            house: {
              select: {
                name: true,
                address: true,
              },
            },
            roomServices: {
              select: {
                price: true,
                quantity: true,
                totalPrice: true,
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const customer = session.customer_details || {};
    const serviceItems = toServiceItems(invoice?.Room?.roomServices || []);

    return res.status(200).json({
      message: result.alreadyPaid
        ? "Invoice was already PAID"
        : "Invoice status updated to PAID",
      invoiceId,
      status: result.invoice.status,
      alreadyPaid: result.alreadyPaid,
      receipt: {
        payer: {
          fullName: invoice?.Tenant?.fullName || customer?.name || "N/A",
          email: invoice?.Tenant?.email || customer?.email || "N/A",
          phone: invoice?.Tenant?.phone || customer?.phone || "N/A",
        },
        invoice: {
          id: invoice?.id,
          month: invoice?.month,
          year: invoice?.year,
          status: invoice?.status,
          roomPrice: invoice?.roomPrice,
          electricCost: invoice?.electricCost,
          waterCost: invoice?.waterCost,
          serviceCost: invoice?.serviceCost,
          serviceItems,
          totalAmount: invoice?.totalAmount,
          createdAt: invoice?.createdAt,
          roomName: invoice?.Room?.name || "N/A",
          houseName: invoice?.Room?.house?.name || "N/A",
          houseAddress: invoice?.Room?.house?.address || "N/A",
        },
        transaction: {
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
          checkoutStatus: session.status,
          paidAt: session.created,
        },
      },
    });
  } catch (error) {
    console.error("CONFIRM STRIPE SESSION ERROR:", {
      message: error?.message,
      stack: error?.stack,
    });
    return res
      .status(500)
      .json({ message: "Failed to confirm Stripe payment" });
  }
}
