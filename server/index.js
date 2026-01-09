import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Sample route
// app.get("/", (req, res) => {
//   res.send("Welcome to the BHMS server!");
// });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
