import { prisma } from "../lib/prisma.js";

export async function listTenants() {
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

  return tenants.map((tenant) => ({
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
}

export async function getTenantById(id) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: parseInt(id, 10) },
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

  return tenant;
}

export async function createTenant(data) {
  const { email, fullName, phone, gender, age, roomId, startDate } = data;

  const roomIdNumber = parseInt(roomId, 10);
  if (!email || !fullName || Number.isNaN(roomIdNumber)) {
    const error = new Error("Email, fullName và roomId là bắt buộc");
    error.status = 400;
    throw error;
  }

  const startDateValue = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(startDateValue.getTime())) {
    const error = new Error("Ngày bắt đầu không hợp lệ");
    error.status = 400;
    throw error;
  }

  const room = await prisma.room.findUnique({ where: { id: roomIdNumber } });
  if (!room) {
    const error = new Error("Phòng không tồn tại");
    error.status = 404;
    throw error;
  }

  const existingTenant = await prisma.tenant.findFirst({ where: { email } });
  if (existingTenant) {
    const error = new Error("Email đã tồn tại");
    error.status = 400;
    throw error;
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

  return tenant;
}

export async function updateTenant(id, data) {
  const { fullName, email, phone, gender, age, endDate } = data;

  const tenant = await prisma.tenant.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!tenant) {
    const error = new Error("Tenant not found");
    error.status = 404;
    throw error;
  }

  if (email && email !== tenant.email) {
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        email,
        id: { not: parseInt(id, 10) },
      },
    });
    if (existingTenant) {
      const error = new Error("Email already exists");
      error.status = 400;
      throw error;
    }
  }

  const updatedTenant = await prisma.tenant.update({
    where: { id: parseInt(id, 10) },
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

  return updatedTenant;
}

export async function deleteTenant(id) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!tenant) {
    const error = new Error("Tenant not found");
    error.status = 404;
    throw error;
  }

  await prisma.tenant.delete({ where: { id: parseInt(id, 10) } });
  return { message: "Tenant deleted successfully" };
}
