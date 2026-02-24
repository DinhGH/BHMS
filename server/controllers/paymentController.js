import { getAllPayments } from "../services/paymentService.js";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is missing");
    return null;
  }
  return new Stripe(secretKey, { apiVersion: "2023-10-16" });
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

  if (existing.status === "PAID") {
    console.log("PAYMENT STATUS: Invoice already PAID", {
      invoiceId: parsedInvoiceId,
      source,
      ...extra,
    });
    return { alreadyPaid: true, invoice: existing };
  }

  const updated = await prisma.invoice.update({
    where: { id: parsedInvoiceId },
    data: { status: "PAID" },
    select: { id: true, status: true, roomId: true },
  });

  console.log("PAYMENT STATUS: Invoice marked PAID", {
    invoiceId: parsedInvoiceId,
    source,
    roomId: updated.roomId,
    ...extra,
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
          },
        },
      },
    });

    const customer = session.customer_details || {};

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
