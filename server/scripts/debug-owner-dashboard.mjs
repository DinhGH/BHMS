import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const owners = await prisma.owner.findMany({
    select: {
      id: true,
      userId: true,
      _count: {
        select: {
          houses: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const housesByOwner = await prisma.boardingHouse.groupBy({
    by: ["ownerId"],
    _count: {
      _all: true,
    },
    orderBy: {
      ownerId: "asc",
    },
  });

  const invoicesByStatus = await prisma.invoice.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
    _sum: {
      totalAmount: true,
    },
  });

  console.log("owners:", owners);
  console.log("housesByOwner:", housesByOwner);
  console.log("invoicesByStatus:", invoicesByStatus);
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
