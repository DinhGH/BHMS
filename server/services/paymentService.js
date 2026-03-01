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
    const paymentProofImageSelect = hasCol(paymentCols, "proofImage")
      ? "p.proofImage AS proofImage"
      : "NULL AS proofImage";

    const sql = `
      SELECT
        p.id,
        p.invoiceId,
        p.method,
        p.amount,
        p.confirmed,
        p.createdAt,
        ${paymentImgSelect},
        ${paymentProofImageSelect},
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

    const invoiceIds = [
      ...new Set(
        payments
          .map((payment) => Number(payment.invoiceId))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    ];

    const invoiceDetailList = invoiceIds.length
      ? await prisma.invoice.findMany({
          where: { id: { in: invoiceIds } },
          select: {
            id: true,
            month: true,
            year: true,
            roomPrice: true,
            electricCost: true,
            waterCost: true,
            serviceCost: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            Room: {
              select: {
                roomServices: {
                  select: {
                    id: true,
                    quantity: true,
                    price: true,
                    totalPrice: true,
                    service: {
                      select: {
                        name: true,
                        unit: true,
                        priceType: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : [];

    const invoiceDetailsById = new Map(
      invoiceDetailList.map((invoice) => {
        const serviceItems = (invoice?.Room?.roomServices || []).map((item) => {
          const quantity = Number(item?.quantity ?? 1) || 1;
          const unitPrice = Number(item?.price || 0);
          const totalPrice = Number(item?.totalPrice ?? unitPrice * quantity);

          return {
            id: item.id,
            name: item?.service?.name || "Service",
            unit: item?.service?.unit || null,
            priceType: item?.service?.priceType || null,
            quantity,
            unitPrice,
            totalPrice,
          };
        });

        return [
          invoice.id,
          {
            id: invoice.id,
            month: invoice.month,
            year: invoice.year,
            roomPrice: invoice.roomPrice,
            electricCost: invoice.electricCost,
            waterCost: invoice.waterCost,
            serviceCost: invoice.serviceCost,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            createdAt: invoice.createdAt,
            serviceItems,
          },
        ];
      }),
    );

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

      const invoiceDetail = invoiceDetailsById.get(Number(payment.invoiceId));

      return {
        id: payment.id,
        paymentId,
        amount: payment.amount,
        method: payment.method,
        confirmed: !!payment.confirmed,
        createdAt: payment.createdAt,
        img: payment.proofImage ?? payment.img ?? null,
        invoiceId: payment.invoiceId,
        invoiceStatus: invoice.status ?? null,
        invoice: {
          ...invoice,
          ...(invoiceDetail || {}),
        },
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
