import { prisma } from "../lib/prisma.js";

function validateId(id, name) {
  if (!id || Number.isNaN(Number(id))) {
    const err = new Error(`Invalid ${name}`);
    err.statusCode = 400;
    throw err;
  }
  return Number(id);
}

export async function fetchTenantProfile(userId) {
  const uid = validateId(userId, "userId");

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      createdAt: true,
      tenant: { select: { id: true } },
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== "TENANT") {
    const err = new Error("User is not a tenant");
    err.statusCode = 403;
    throw err;
  }

  return user;
}

export async function fetchTenantRoom(userId) {
  const uid = validateId(userId, "userId");

  const tenant = await prisma.tenant.findUnique({
    where: { userId: uid },
    select: {
      id: true,
      invoices: {
        select: { roomId: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!tenant) {
    const err = new Error("Tenant record not found");
    err.statusCode = 404;
    throw err;
  }

  const roomId = tenant.invoices[0]?.roomId;
  if (!roomId) return null;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      name: true,
      price: true,
      isLocked: true,
      electricMeter: true,
      waterMeter: true,
      house: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  return room;
}
