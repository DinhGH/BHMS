import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

const ALLOWED_TABLES = new Set([
  "Payment",
  "Invoice",
  "Tenant",
  "Room",
  "BoardingHouse",
]);

const tableColumnsCache = new Map();

async function getTableColumns(tableName) {
  if (!ALLOWED_TABLES.has(tableName)) {
    throw new Error(`Table not allowed: ${tableName}`);
  }

  if (tableColumnsCache.has(tableName)) return tableColumnsCache.get(tableName);

  const rows = await prisma.$queryRawUnsafe(
    `SHOW COLUMNS FROM \`${tableName}\``
  );
  const cols = new Set((rows || []).map((r) => r.Field));
  tableColumnsCache.set(tableName, cols);
  return cols;
}

function hasCol(cols, name) {
  return cols && cols.has(name);
}

app.get("/api/payments", async (req, res) => {
  try {
    const invoiceCols = await getTableColumns("Invoice");
    const paymentCols = await getTableColumns("Payment");
    const tenantCols = await getTableColumns("Tenant");

    const invoiceSelectParts = Array.from(invoiceCols).map(
      (col) => `i.\`${col}\` AS invoice_${col}`
    );

    const tenantSelectParts = [
      hasCol(tenantCols, "fullName")
        ? "t.fullName AS tenantName"
        : "NULL AS tenantName",
      hasCol(tenantCols, "email") ? "t.email AS tenantEmail" : "NULL AS tenantEmail",
    ];

    const paymentImgSelect = hasCol(paymentCols, "img")
      ? "p.img"
      : "NULL AS img";

    const sql = `
      SELECT
        p.id,
        p.invoiceId,
        p.method,
        p.amount,
        p.confirmed,
        p.createdAt,
        ${paymentImgSelect},
        ${invoiceSelectParts.join(", ")},
        ${tenantSelectParts.join(", ")},
        r.name AS roomName,
        b.name AS houseName
      FROM Payment p
      LEFT JOIN Invoice i ON i.id = p.invoiceId
      LEFT JOIN Tenant t ON t.id = i.tenantId
      LEFT JOIN Room r ON r.id = i.roomId
      LEFT JOIN BoardingHouse b ON b.id = r.houseId
      ORDER BY p.createdAt DESC
    `;

    const payments = await prisma.$queryRawUnsafe(sql);

    const data = payments.map((payment) => {
      const roomLabel = payment.roomName
        ? `${payment.roomName}${payment.houseName ? ` - ${payment.houseName}` : ""}`
        : "";

      const paymentId = `PAY${String(payment.id).padStart(3, "0")}`;

      const invoice = {};
      for (const col of invoiceCols) {
        const key = `invoice_${col}`;
        invoice[col] = Object.prototype.hasOwnProperty.call(payment, key)
          ? payment[key]
          : null;
      }

      return {
        id: payment.id,
        paymentId,
        amount: payment.amount,
        method: payment.method,
        confirmed: !!payment.confirmed,
        createdAt: payment.createdAt,
        img: payment.img ?? null,
        invoiceId: payment.invoiceId,
        invoiceStatus: invoice.status ?? null,
        invoice,
        tenantName: payment.tenantName || payment.tenantEmail || "",
        roomName: payment.roomName ?? "",
        houseName: payment.houseName ?? "",
        roomLabel,
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Failed to fetch payments", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

// Get all tenants with user information
app.get("/api/tenants", async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        invoices: {
          select: {
            id: true,
            status: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            house: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = tenants.map((tenant) => ({
      id: tenant.id,
      fullName: tenant.fullName || "",
      email: tenant.email || "",
      phone: tenant.phone || "-",
      gender: tenant.gender || "-",
      age: tenant.age || "-",
      status: "ACTIVE",
      createdAt: tenant.createdAt,
      startDate: tenant.startDate,
      endDate: tenant.endDate,
      invoiceCount: tenant.invoices?.length || 0,
      roomId: tenant.roomId,
      room: tenant.room,
      imageUrl: tenant.imageUrl,
    }));

    res.json(data);
  } catch (error) {
    console.error("Failed to fetch tenants", error);
    res.status(500).json({ message: "Failed to fetch tenants" });
  }
});

// Get single tenant by ID with invoices
app.get("/api/tenants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(id) },
      include: {
        invoices: {
          include: {
            room: {
              include: {
                house: true,
              },
            },
            payment: true,
          },
        },
        room: {
          include: {
            house: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json(tenant);
  } catch (error) {
    console.error("Failed to fetch tenant", error);
    res.status(500).json({ message: "Failed to fetch tenant" });
  }
});

// Create new tenant
app.post("/api/tenants", async (req, res) => {
  try {
    const { email, fullName, phone, gender, age, roomId, startDate } = req.body;

    const roomIdNumber = parseInt(roomId, 10);
    if (!email || !fullName || Number.isNaN(roomIdNumber)) {
      return res
        .status(400)
        .json({ message: "Email, fullName và roomId là bắt buộc" });
    }

    const startDateValue = startDate ? new Date(startDate) : new Date();
    if (Number.isNaN(startDateValue.getTime())) {
      return res.status(400).json({ message: "Ngày bắt đầu không hợp lệ" });
    }

    const room = await prisma.room.findUnique({ where: { id: roomIdNumber } });
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    // Check if email already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: { email },
    });

    if (existingTenant) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const tenant = await prisma.tenant.create({
      data: {
        email,
        fullName,
        phone: phone || "",
        gender: gender || "OTHER",
        age: age || 0,
        roomId: roomIdNumber,
        startDate: startDateValue,
      },
      include: {
        invoices: true,
        room: {
          include: {
            house: true,
          },
        },
      },
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error("Failed to create tenant", error);
    res
      .status(500)
      .json({ message: error.message || "Không thể tạo người thuê" });
  }
});

// Update tenant information
app.patch("/api/tenants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, gender, age, endDate } = req.body;

    // Find tenant first
    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Check if email is already taken by another tenant
    if (email && email !== tenant.email) {
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          email,
          id: { not: parseInt(id) },
        },
      });
      if (existingTenant) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: parseInt(id) },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(age && { age }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: {
        invoices: true,
        room: {
          include: {
            house: true,
          },
        },
      },
    });

    res.json(updatedTenant);
  } catch (error) {
    console.error("Failed to update tenant", error);
    res.status(500).json({ message: "Failed to update tenant" });
  }
});

// Delete tenant
app.delete("/api/tenants/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Delete tenant (Invoices and RentalContracts will cascade delete based on schema)
    await prisma.tenant.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Failed to delete tenant", error);
    res.status(500).json({ message: "Failed to delete tenant" });
  }
});

// Sample route
// app.get("/", (req, res) => {
//   res.send("Welcome to the BHMS server!");
// });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
