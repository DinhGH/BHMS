import express from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

// Stripe webhook endpoint - uses raw body
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      if (!webhookSecret) {
        return res.status(500).send("Webhook secret not configured");
      }

      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("❌ Signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("🔔 Event:", event.type);

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        if (session.payment_status !== "paid") {
          return res.json({ received: true });
        }

        const invoiceId = parseInt(session.metadata?.invoiceId, 10);
        if (!invoiceId) return res.json({ received: true });

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID" },
        });

        await prisma.payment.upsert({
          where: { stripeSessionId: session.id },
          update: {},
          create: {
            stripeSessionId: session.id,
            invoiceId,
            method: "GATEWAY",
            amount: session.amount_total / 100,
            confirmed: true,
          },
        });

        console.log(`✅ Invoice ${invoiceId} marked PAID`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).send();
    }
  },
);

export default router;
