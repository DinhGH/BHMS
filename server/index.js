import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/services.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import reportAdminRoutes from "./routes/reportAdminRoutes.js";
import stripeRoute from "./routes/stripe.routes.js";

import ownerRoute from "./routes/owner.route.js";
import adminRoutes from "./routes/admin.routes.js";

import { handleStripeWebhook } from "./controllers/paymentController.js";

// Scheduled tasks
import { scheduleOverdueCheck } from "./services/overdueService.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
// Stripe webhook (raw body middleware inside route)
app.use("/webhook", stripeRoute);
// Stripe webhook must be registered BEFORE express.json()
// because it needs raw body for signature verification
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully 🚀" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/report-admins", reportAdminRoutes);
app.use("/api/owner", ownerRoute);
app.use("/api/users", adminRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Central error handler to avoid server crashes
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize scheduled tasks
  console.log("📅 Initializing scheduled tasks...");
  scheduleOverdueCheck();
  const hour = Number(process.env.OVERDUE_CHECK_HOUR || 6);
  const minute = Number(process.env.OVERDUE_CHECK_MINUTE || 0);
  console.log(
    `✓ Overdue check scheduled (runs daily at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")})`,
  );
});
