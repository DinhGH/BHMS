import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/services.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
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
});
