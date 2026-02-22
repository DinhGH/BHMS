import { prisma } from "../lib/prisma.js";

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const normalizeStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getContractStatus = (startDate, endDate) => {
  const today = normalizeStartOfDay(new Date());
  const start = normalizeStartOfDay(startDate);

  if (start > today) return "UPCOMING";
  if (!endDate) return "ACTIVE";

  const end = normalizeStartOfDay(endDate);
  if (end < today) return "EXPIRED";
  return "ACTIVE";
};

const mapContract = (contract) => {
  const status = getContractStatus(contract.startDate, contract.endDate);
  return {
    id: contract.id,
    tenantId: contract.tenantId,
    roomId: contract.roomId,
    startDate: contract.startDate,
    endDate: contract.endDate,
    terms: contract.terms,
    createdAt: contract.createdAt,
    status,
    hasNoEndDate: !contract.endDate,
    tenant: contract.Tenant
      ? {
          id: contract.Tenant.id,
          fullName: contract.Tenant.fullName,
          email: contract.Tenant.email,
          phone: contract.Tenant.phone,
          gender: contract.Tenant.gender,
        }
      : null,
    room: contract.Room
      ? {
          id: contract.Room.id,
          name: contract.Room.name,
          price: contract.Room.price,
          houseId: contract.Room.houseId,
          boardingHouseName: contract.Room.BoardingHouse?.name || null,
          boardingHouseAddress: contract.Room.BoardingHouse?.address || null,
        }
      : null,
  };
};

const hasBoardingHouseByOwner = async (ownerId) => {
  const count = await prisma.boardingHouse.count({
    where: { ownerId },
  });
  return count > 0;
};

const getOwnerContractById = async (contractId, ownerId, restrictByOwner) => {
  const where = {
    id: contractId,
  };

  if (restrictByOwner) {
    where.Room = {
      BoardingHouse: {
        ownerId,
      },
    };
  }

  return prisma.rentalContract.findFirst({
    where,
    include: {
      Tenant: true,
      Room: {
        include: {
          BoardingHouse: true,
        },
      },
    },
  });
};

const invoiceHistorySelect = {
  id: true,
  roomId: true,
  tenantId: true,
  roomPrice: true,
  electricCost: true,
  waterCost: true,
  serviceCost: true,
  totalAmount: true,
  status: true,
  month: true,
  year: true,
  createdAt: true,
  Payment: {
    select: {
      id: true,
      confirmed: true,
      amount: true,
      method: true,
      createdAt: true,
    },
  },
};

export const getOwnerContracts = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const restrictByOwner = await hasBoardingHouseByOwner(ownerId);
    const search = (req.query.search || "").trim().toLowerCase();
    const statusFilter = (req.query.status || "all").toLowerCase();

    const where = {};
    if (restrictByOwner) {
      where.Room = {
        BoardingHouse: {
          ownerId,
        },
      };
    }

    const contracts = await prisma.rentalContract.findMany({
      where,
      include: {
        Tenant: true,
        Room: {
          include: {
            BoardingHouse: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mapped = contracts.map(mapContract);

    const filtered = mapped.filter((item) => {
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && item.status === "ACTIVE") ||
        (statusFilter === "expired" && item.status === "EXPIRED") ||
        (statusFilter === "upcoming" && item.status === "UPCOMING") ||
        (statusFilter === "no_end_date" && item.hasNoEndDate);

      if (!statusMatch) return false;
      if (!search) return true;

      const source = [
        String(item.id),
        item.room?.name || "",
        item.room?.boardingHouseName || "",
        item.tenant?.fullName || "",
        item.tenant?.email || "",
        item.terms || "",
      ]
        .join(" ")
        .toLowerCase();

      return source.includes(search);
    });

    return res.json(filtered);
  } catch (error) {
    console.error("GET OWNER CONTRACTS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getOwnerContractDetail = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const restrictByOwner = await hasBoardingHouseByOwner(ownerId);
    const contractId = Number(req.params.id);

    if (Number.isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract id" });
    }

    const contract = await getOwnerContractById(
      contractId,
      ownerId,
      restrictByOwner,
    );
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        roomId: contract.roomId,
        tenantId: contract.tenantId,
      },
      select: invoiceHistorySelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      ...mapContract(contract),
      invoiceHistory: invoices,
    });
  } catch (error) {
    console.error("GET OWNER CONTRACT DETAIL ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getOwnerContractInvoices = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const restrictByOwner = await hasBoardingHouseByOwner(ownerId);
    const contractId = Number(req.params.id);

    if (Number.isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract id" });
    }

    const contract = await getOwnerContractById(
      contractId,
      ownerId,
      restrictByOwner,
    );
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        roomId: contract.roomId,
        tenantId: contract.tenantId,
      },
      select: invoiceHistorySelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(invoices);
  } catch (error) {
    console.error("GET OWNER CONTRACT INVOICES ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getOwnerContractStayHistory = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const restrictByOwner = await hasBoardingHouseByOwner(ownerId);
    const contractId = Number(req.params.id);

    if (Number.isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract id" });
    }

    const contract = await getOwnerContractById(
      contractId,
      ownerId,
      restrictByOwner,
    );
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const tenantWhere = {
      tenantId: contract.tenantId,
    };

    const roomWhere = {
      roomId: contract.roomId,
    };

    if (restrictByOwner) {
      tenantWhere.Room = {
        BoardingHouse: {
          ownerId,
        },
      };

      roomWhere.Room = {
        BoardingHouse: {
          ownerId,
        },
      };
    }

    const [tenantHistoryRaw, roomHistoryRaw] = await Promise.all([
      prisma.rentalContract.findMany({
        where: tenantWhere,
        include: {
          Tenant: true,
          Room: {
            include: {
              BoardingHouse: true,
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      }),
      prisma.rentalContract.findMany({
        where: roomWhere,
        include: {
          Tenant: true,
          Room: {
            include: {
              BoardingHouse: true,
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      }),
    ]);

    return res.json({
      contractId,
      tenantHistory: tenantHistoryRaw.map(mapContract),
      roomHistory: roomHistoryRaw.map(mapContract),
    });
  } catch (error) {
    console.error("GET OWNER CONTRACT STAY HISTORY ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getOwnerContractOptions = async (req, res) => {
  try {
    const ownerId = req.ownerId;

    let rooms = await prisma.room.findMany({
      where: {
        BoardingHouse: {
          ownerId,
        },
      },
      include: {
        BoardingHouse: true,
        Tenant: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!rooms.length) {
      rooms = await prisma.room.findMany({
        include: {
          BoardingHouse: true,
          Tenant: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    const roomOptions = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      houseId: room.houseId,
      boardingHouseName: room.BoardingHouse?.name || null,
    }));

    const tenantOptions = rooms.flatMap((room) =>
      room.Tenant.map((tenant) => ({
        id: tenant.id,
        fullName: tenant.fullName,
        email: tenant.email,
        phone: tenant.phone,
        roomId: room.id,
        roomName: room.name,
      })),
    );

    return res.json({ rooms: roomOptions, tenants: tenantOptions });
  } catch (error) {
    console.error("GET OWNER CONTRACT OPTIONS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createOwnerContract = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const restrictByOwner = await hasBoardingHouseByOwner(ownerId);
    const { tenantId, roomId, startDate, endDate, terms } = req.body;

    const parsedTenantId = Number(tenantId);
    const parsedRoomId = Number(roomId);
    const parsedStartDate = toDateOrNull(startDate);
    const parsedEndDate = toDateOrNull(endDate);

    if (
      Number.isNaN(parsedTenantId) ||
      Number.isNaN(parsedRoomId) ||
      !parsedStartDate
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    if (parsedEndDate && parsedEndDate < parsedStartDate) {
      return res
        .status(400)
        .json({ message: "End date must be greater than start date" });
    }

    const room = restrictByOwner
      ? await prisma.room.findFirst({
          where: {
            id: parsedRoomId,
            BoardingHouse: {
              ownerId,
            },
          },
        })
      : await prisma.room.findUnique({
          where: {
            id: parsedRoomId,
          },
        });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        id: parsedTenantId,
      },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    if (tenant.roomId !== parsedRoomId) {
      return res.status(400).json({
        message: "Tenant must belong to selected room",
      });
    }

    const overlap = await prisma.rentalContract.findFirst({
      where: {
        roomId: parsedRoomId,
        tenantId: parsedTenantId,
        startDate: {
          lte: parsedStartDate,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: parsedStartDate,
            },
          },
        ],
      },
    });

    if (overlap) {
      return res.status(409).json({
        message: "Contract already exists in selected period",
      });
    }

    const created = await prisma.$transaction(async (tx) => {
      const contract = await tx.rentalContract.create({
        data: {
          tenantId: parsedTenantId,
          roomId: parsedRoomId,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          terms: terms?.trim() || null,
        },
        include: {
          Tenant: true,
          Room: {
            include: {
              BoardingHouse: true,
            },
          },
        },
      });

      await tx.room.update({
        where: {
          id: parsedRoomId,
        },
        data: {
          contractStart: parsedStartDate,
          contractEnd: parsedEndDate,
        },
      });

      return contract;
    });

    return res.status(201).json(mapContract(created));
  } catch (error) {
    console.error("CREATE OWNER CONTRACT ERROR:", error);
    return res.status(500).json({ message: "Create contract failed" });
  }
};

export const updateOwnerContract = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const restrictByOwner = await hasBoardingHouseByOwner(ownerId);
    const contractId = Number(req.params.id);

    if (Number.isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract id" });
    }

    const currentContract = await getOwnerContractById(
      contractId,
      ownerId,
      restrictByOwner,
    );
    if (!currentContract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const nextTenantId =
      req.body.tenantId !== undefined
        ? Number(req.body.tenantId)
        : currentContract.tenantId;

    const nextRoomId =
      req.body.roomId !== undefined
        ? Number(req.body.roomId)
        : currentContract.roomId;

    if (Number.isNaN(nextTenantId) || Number.isNaN(nextRoomId)) {
      return res.status(400).json({ message: "Invalid tenant or room" });
    }

    const nextStartDate =
      req.body.startDate !== undefined
        ? toDateOrNull(req.body.startDate)
        : currentContract.startDate;

    const nextEndDate =
      req.body.endDate !== undefined
        ? toDateOrNull(req.body.endDate)
        : currentContract.endDate;

    if (!nextStartDate) {
      return res.status(400).json({ message: "Invalid start date" });
    }

    if (nextEndDate && nextEndDate < nextStartDate) {
      return res
        .status(400)
        .json({ message: "End date must be greater than start date" });
    }

    const room = restrictByOwner
      ? await prisma.room.findFirst({
          where: {
            id: nextRoomId,
            BoardingHouse: {
              ownerId,
            },
          },
        })
      : await prisma.room.findUnique({
          where: {
            id: nextRoomId,
          },
        });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: nextTenantId },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    if (tenant.roomId !== nextRoomId) {
      return res.status(400).json({
        message: "Tenant must belong to selected room",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const contract = await tx.rentalContract.update({
        where: {
          id: contractId,
        },
        data: {
          tenantId: nextTenantId,
          roomId: nextRoomId,
          startDate: nextStartDate,
          endDate: nextEndDate,
          terms:
            req.body.terms !== undefined
              ? req.body.terms?.trim() || null
              : currentContract.terms,
        },
        include: {
          Tenant: true,
          Room: {
            include: {
              BoardingHouse: true,
            },
          },
        },
      });

      await tx.room.update({
        where: {
          id: nextRoomId,
        },
        data: {
          contractStart: nextStartDate,
          contractEnd: nextEndDate,
        },
      });

      return contract;
    });

    return res.json(mapContract(updated));
  } catch (error) {
    console.error("UPDATE OWNER CONTRACT ERROR:", error);
    return res.status(500).json({ message: "Update contract failed" });
  }
};

export const deleteOwnerContract = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const restrictByOwner = await hasBoardingHouseByOwner(ownerId);
    const contractId = Number(req.params.id);

    if (Number.isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract id" });
    }

    const contract = await getOwnerContractById(
      contractId,
      ownerId,
      restrictByOwner,
    );
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    await prisma.rentalContract.delete({
      where: {
        id: contractId,
      },
    });

    return res.json({ message: "Contract deleted successfully" });
  } catch (error) {
    console.error("DELETE OWNER CONTRACT ERROR:", error);
    return res.status(500).json({ message: "Delete contract failed" });
  }
};