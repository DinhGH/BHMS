import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import serviceRoutes from "./routes/services.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/api/services", serviceRoutes);

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
