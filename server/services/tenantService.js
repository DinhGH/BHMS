import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
export async function listTenants() {
  const tenants = await prisma.tenant.findMany({
    include: {
      invoices: {
        select: {
          id: true,
          status: true,
        },
      },
      Room: {
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
    invoiceCount: tenant.Invoice?.length || 0,
    roomId: tenant.roomId,
    room: tenant.Room,
    imageUrl: tenant.imageUrl,
  }));
}

export async function getTenantById(id) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      invoices: {
        include: {
          Room: {
            include: {
              BoardingHouse: true,
            },
          },
          Payment: true,
        },
      },
      Room: {
        include: {
          BoardingHouse: true,
        },
      },
    },
  });

  return tenant ? { ...tenant, room: tenant.Room } : null;
}

export async function createTenant(data) {
  const { email, fullName, phone, gender, age, roomId, startDate } = data;

  if (!email || !fullName) {
    const error = new Error("Email và fullName là bắt buộc");
    error.status = 400;
    throw error;
  }

  // Validate age >= 18
  const ageNumber = parseInt(age, 10);
  if (!Number.isNaN(ageNumber) && ageNumber < 18) {
    const error = new Error("Age must be at least 18 years old");
    error.status = 400;
    throw error;
  }

  const startDateValue = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(startDateValue.getTime())) {
    const error = new Error("Ngày bắt đầu không hợp lệ");
    error.status = 400;
    throw error;
  }

  let roomIdNumber = null;
  if (roomId) {
    roomIdNumber = parseInt(roomId, 10);
    if (Number.isNaN(roomIdNumber) || roomIdNumber < 1) {
      const error = new Error("Please select a valid room");
      error.status = 400;
      throw error;
    }
    const room = await prisma.room.findUnique({ where: { id: roomIdNumber } });
    if (!room) {
      const error = new Error("Phòng không tồn tại");
      error.status = 404;
      throw error;
    }
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
      Room: {
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

  // Validate age >= 18
  if (age !== undefined && age !== null) {
    const ageNumber = parseInt(age, 10);
    if (!Number.isNaN(ageNumber) && ageNumber < 18) {
      const error = new Error("Age must be at least 18 years old");
      error.status = 400;
      throw error;
    }
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
      ...(phone !== undefined && { phone }),
      ...(gender && { gender }),
      ...(age !== undefined && { age: parseInt(age) || 0 }),
      ...(endDate && { endDate: new Date(endDate) }),
    },
    include: {
      invoices: true,
      Room: {
        include: {
          house: true,
        },
      },
    },
  });

  return updatedTenant;
}

export async function deleteTenant(id) {
  const tenantId = parseInt(id, 10);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    const error = new Error("Tenant not found");
    error.status = 404;
    throw error;
  }

  try {
    await prisma.tenant.delete({
      where: { id: tenantId },
    });

    return { message: "Tenant deleted successfully" };
  } catch (error) {
    // 🔥 Handle foreign key constraint error (P2003)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      const customError = new Error(
        "Cannot delete tenant because related invoices or rental contracts exist.",
      );
      customError.status = 400;
      throw customError;
    }

    throw error; // re-throw other errors
  }
}
