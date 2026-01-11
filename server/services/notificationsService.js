import { prisma } from "../lib/prisma.js";

export async function listNotifications({ userId, query }) {
  if (!userId || Number.isNaN(Number(userId))) {
    const err = new Error("Missing or invalid userId");
    err.statusCode = 400;
    throw err;
  }

  const where = {
    userId: Number(userId),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}
