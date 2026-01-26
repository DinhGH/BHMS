import { prisma } from "../lib/prisma.js";

const owners = await prisma.owner.findMany({
  select: { id: true, userId: true },
});
console.log(JSON.stringify(owners));
await prisma.$disconnect();
