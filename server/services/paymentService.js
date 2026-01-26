import { prisma } from "../lib/prisma.js";

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
    `SHOW COLUMNS FROM \`${tableName}\``,
  );
  const cols = new Set((rows || []).map((r) => r.Field));
  tableColumnsCache.set(tableName, cols);
  return cols;
}

function hasCol(cols, name) {
  return cols && cols.has(name);
}

export async function getAllPayments() {
  try {
    const invoiceCols = await getTableColumns("Invoice");
    const paymentCols = await getTableColumns("Payment");
    const tenantCols = await getTableColumns("Tenant");

    const invoiceSelectParts = Array.from(invoiceCols).map(
      (col) => `i.\`${col}\` AS invoice_${col}`,
    );

    const tenantSelectParts = [
      hasCol(tenantCols, "fullName")
        ? "t.fullName AS tenantName"
        : "NULL AS tenantName",
      hasCol(tenantCols, "email")
        ? "t.email AS tenantEmail"
        : "NULL AS tenantEmail",
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

    return data;
  } catch (error) {
    console.error("Failed to fetch payments", error);
    throw error;
  }
}
