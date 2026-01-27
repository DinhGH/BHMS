import { prisma } from "../lib/prisma.js";

const targetDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
const room = await prisma.room.findFirst({
  select: {
    id: true,
    price: true,
  },
});
const tenant = await prisma.tenant.findFirst({
  select: {
    id: true,
  },
});

if (!room || !tenant) {
  console.log("No room or tenant found");
  process.exit(1);
}

let month = targetDate.getMonth() + 1;
let year = targetDate.getFullYear();
let attempts = 0;

while (attempts < 12) {
  const existing = await prisma.invoice.findFirst({ where: { roomId: room.id, month, year } });
  if (!existing) break;
  month -= 1;
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  attempts += 1;
}

const invoice = await prisma.invoice.create({
  data: {
    roomId: room.id,
    tenantId: tenant.id,
    roomPrice: room.price ?? 0,
    electricCost: 0,
    waterCost: 0,
    serviceCost: 0,
    totalAmount: room.price ?? 0,
    month,
    year,
    status: "PENDING",
    createdAt: targetDate,
  },
});

console.log("Created overdue-test invoice", {
  id: invoice.id,
  roomId: room.id,
  tenantId: tenant.id,
  month,
  year,
  createdAt: invoice.createdAt,
});
