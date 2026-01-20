import express from "express";
import cors from "cors";
import tenantRoutes from "./routes/tenant.route.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/tenants", tenantRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
