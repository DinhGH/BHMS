import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function clearMigrations() {
  await prisma.$executeRawUnsafe("DELETE FROM _prisma_migrations");
  console.log("Migration history cleared!");
}

clearMigrations()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
