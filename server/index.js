import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import reportRoutes from "./routes/reportRoutes.js";
import reportAdminRoutes from "./routes/reportAdminRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/reports", reportRoutes);
app.use("/api/report-admins", reportAdminRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
