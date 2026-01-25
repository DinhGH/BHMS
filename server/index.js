import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/services.js";

import userRouter from "./src/routers/admin.routes.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/users", userRouter);

// 404 handler for unmatched routes (after all routes)
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

// Sample route
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// Start server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
