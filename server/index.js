import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import notificationRoutes from "./routes/notifications.js";
import tenantRoutes from "./routes/tenant.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// API routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/tenant", tenantRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
