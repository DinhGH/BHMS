import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
<<<<<<< HEAD
import authRoutes from "./routes/authRoutes.js";
<<<<<<< HEAD

const app = express();
const PORT = process.env.PORT || 5000;
=======
import userRoutes from "./routes/userRoutes.js";
=======
import serviceRoutes from "./routes/services.js";
>>>>>>> owner

const app = express();
const PORT = process.env.PORT || 3000;

>>>>>>> i-sprint1-1-admin-owner
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// Routes
<<<<<<< HEAD
app.use("/api/auth", authRoutes);
<<<<<<< HEAD
=======
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
>>>>>>> owner

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully 🚀" });
});
=======
app.use("/api/user", userRoutes);
>>>>>>> i-sprint1-1-admin-owner

// Sample route
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
