import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const owners = await prisma.owner.findMany({
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
      _count: {
        select: {
          houses: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  for (const owner of owners) {
    const roomCount = await prisma.room.count({
      where: {
        house: {
          ownerId: owner.id,
        },
      },
    });

    const tenantCount = await prisma.tenant.count({
      where: {
        Room: {
          house: {
            ownerId: owner.id,
          },
        },
      },
    });

    const invoiceCount = await prisma.invoice.count({
      where: {
        Room: {
          house: {
            ownerId: owner.id,
          },
        },
      },
    });

    console.log({
      ownerId: owner.id,
      userId: owner.userId,
      email: owner.user.email,
      fullName: owner.user.fullName,
      houses: owner._count.houses,
      rooms: roomCount,
      tenants: tenantCount,
      invoices: invoiceCount,
    });
  }
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
