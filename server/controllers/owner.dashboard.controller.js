import { prisma } from "../lib/prisma.js";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const toUsd = (amount, exchangeRate, moneyScale) =>
  Number(((Number(amount || 0) * moneyScale) / exchangeRate).toFixed(2));

const normalizeYear = (input) => {
  if (input === undefined || input === null || input === "") {
    return null;
  }

  const parsed = Number(input);

  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
    return null;
  }

  return parsed;
};

export const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.ownerId;
    const requestedYear = normalizeYear(req.query.year);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const exchangeRate = Number(process.env.USD_EXCHANGE_RATE || 25000);

    const roomPriceAggregate = await prisma.room.aggregate({
      where: {
        house: {
          ownerId,
        },
      },
      _avg: {
        price: true,
      },
    });

    const avgRoomPrice = Number(roomPriceAggregate._avg.price || 0);
    const envMoneyScale = Number(process.env.MONEY_SCALE || 0);
    const moneyScale = envMoneyScale > 0 ? envMoneyScale : avgRoomPrice > 0 && avgRoomPrice < 10000 ? 1000 : 1;

    const availableYearRows = await prisma.invoice.findMany({
      where: {
        Room: {
          house: {
            ownerId,
          },
        },
      },
      select: {
        year: true,
      },
      distinct: ["year"],
      orderBy: {
        year: "desc",
      },
    });

    const availableYears = availableYearRows.map((row) => row.year);
    const year = requestedYear ?? availableYears[0] ?? now.getFullYear();

    const [totalBoardingHouses, rooms, totalTenants, invoicesInYear, recentInvoices] =
      await Promise.all([
        prisma.boardingHouse.count({
          where: { ownerId },
        }),
        prisma.room.findMany({
          where: {
            house: {
              ownerId,
            },
          },
          select: {
            id: true,
            isLocked: true,
            Tenant: {
              select: { id: true },
            },
          },
        }),
        prisma.tenant.count({
          where: {
            Room: {
              house: {
                ownerId,
              },
            },
          },
        }),
        prisma.invoice.findMany({
          where: {
            year,
            Room: {
              house: {
                ownerId,
              },
            },
          },
          select: {
            id: true,
            month: true,
            status: true,
            totalAmount: true,
            roomPrice: true,
            electricCost: true,
            waterCost: true,
            serviceCost: true,
            Room: {
              select: {
                houseId: true,
              },
            },
          },
        }),
        prisma.invoice.findMany({
          where: {
            Room: {
              house: {
                ownerId,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 8,
          select: {
            id: true,
            month: true,
            year: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            Room: {
              select: {
                name: true,
                house: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            Tenant: {
              select: {
                fullName: true,
              },
            },
          },
        }),
      ]);

    const monthlyMap = new Map(
      Array.from({ length: 12 }, (_, idx) => [idx + 1, 0]),
    );
    const paidMonthlyMap = new Map(
      Array.from({ length: 12 }, (_, idx) => [idx + 1, 0]),
    );
    const pendingMonthlyMap = new Map(
      Array.from({ length: 12 }, (_, idx) => [idx + 1, 0]),
    );
    const overdueMonthlyMap = new Map(
      Array.from({ length: 12 }, (_, idx) => [idx + 1, 0]),
    );
    const revenueByHouseMap = new Map();

    let yearRevenue = 0;
    let thisMonthRevenue = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;

    let roomCost = 0;
    let electricCost = 0;
    let waterCost = 0;
    let serviceCost = 0;
    let outstandingAmount = 0;

    invoicesInYear.forEach((invoice) => {
      const amount = Number(invoice.totalAmount || 0);
      const isPaid = invoice.status === "PAID";

      if (invoice.status === "PAID") {
        paidMonthlyMap.set(
          invoice.month,
          (paidMonthlyMap.get(invoice.month) || 0) + 1,
        );
      }

      if (invoice.status === "PENDING") {
        pendingMonthlyMap.set(
          invoice.month,
          (pendingMonthlyMap.get(invoice.month) || 0) + 1,
        );
      }

      if (invoice.status === "OVERDUE") {
        overdueMonthlyMap.set(
          invoice.month,
          (overdueMonthlyMap.get(invoice.month) || 0) + 1,
        );
      }

      if (isPaid) {
        yearRevenue += amount;
        monthlyMap.set(invoice.month, (monthlyMap.get(invoice.month) || 0) + amount);

        const houseId = invoice.Room?.houseId;
        if (houseId) {
          revenueByHouseMap.set(houseId, (revenueByHouseMap.get(houseId) || 0) + amount);
        }

        if (invoice.month === currentMonth) {
          thisMonthRevenue += amount;
        }

        roomCost += Number(invoice.roomPrice || 0);
        electricCost += Number(invoice.electricCost || 0);
        waterCost += Number(invoice.waterCost || 0);
        serviceCost += Number(invoice.serviceCost || 0);
      } else {
        outstandingAmount += amount;
      }

      if (invoice.status === "PAID") paidInvoices += 1;
      if (invoice.status === "PENDING") pendingInvoices += 1;
      if (invoice.status === "OVERDUE") overdueInvoices += 1;
    });

    let occupiedRooms = 0;
    let availableRooms = 0;
    let lockedRooms = 0;

    rooms.forEach((room) => {
      const hasTenant = room.Tenant.length > 0;

      if (room.isLocked) {
        lockedRooms += 1;
        return;
      }

      if (hasTenant) {
        occupiedRooms += 1;
      } else {
        availableRooms += 1;
      }
    });

    const totalRooms = rooms.length;
    const activeRooms = totalRooms - lockedRooms;
    const occupancyRate =
      activeRooms > 0 ? Number(((occupiedRooms / activeRooms) * 100).toFixed(1)) : 0;
    const collectionRate =
      invoicesInYear.length > 0
        ? Number(((paidInvoices / invoicesInYear.length) * 100).toFixed(1))
        : 0;

    const avgRevenuePerPaidInvoice =
      paidInvoices > 0 ? Number((yearRevenue / paidInvoices).toFixed(2)) : 0;

    const monthlyRevenue = Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      return {
        month,
        label: MONTH_LABELS[idx],
        value: toUsd(monthlyMap.get(month) || 0, exchangeRate, moneyScale),
      };
    });

    const invoiceStatusTrend = Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      return {
        month,
        label: MONTH_LABELS[idx],
        paid: paidMonthlyMap.get(month) || 0,
        pending: pendingMonthlyMap.get(month) || 0,
        overdue: overdueMonthlyMap.get(month) || 0,
      };
    });

    const totalPaidCost = roomCost + electricCost + waterCost + serviceCost;
    const toPercent = (value) =>
      totalPaidCost > 0 ? Number(((value / totalPaidCost) * 100).toFixed(1)) : 0;

    const houses = await prisma.boardingHouse.findMany({
      where: {
        ownerId,
      },
      select: {
        id: true,
        name: true,
        address: true,
        rooms: {
          select: {
            id: true,
            isLocked: true,
            Tenant: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const propertyPerformance = houses
      .map((house) => {
        const roomCount = house.rooms.length;
        const houseLockedRooms = house.rooms.filter((r) => r.isLocked).length;
        const houseActiveRooms = roomCount - houseLockedRooms;
        const houseOccupiedRooms = house.rooms.filter(
          (r) => !r.isLocked && r.Tenant.length > 0,
        ).length;

        return {
          id: house.id,
          name: house.name,
          address: house.address,
          rooms: roomCount,
          occupiedRooms: houseOccupiedRooms,
          occupancyRate:
            houseActiveRooms > 0
              ? Number(((houseOccupiedRooms / houseActiveRooms) * 100).toFixed(1))
              : 0,
          yearRevenue: toUsd(
            revenueByHouseMap.get(house.id) || 0,
            exchangeRate,
            moneyScale,
          ),
        };
      })
      .sort((a, b) => b.yearRevenue - a.yearRevenue)
      .slice(0, 5);

    const alerts = [];
    if (overdueInvoices > 0) {
      alerts.push({
        type: "warning",
        title: "Overdue invoices detected",
        description: `${overdueInvoices} overdue invoices need immediate follow-up.`,
      });
    }
    if (occupancyRate < 60 && totalRooms > 0) {
      alerts.push({
        type: "info",
        title: "Low occupancy rate",
        description: `Current occupancy is ${occupancyRate}%. Consider running promotions for vacant rooms.`,
      });
    }
    if (collectionRate < 80 && invoicesInYear.length > 0) {
      alerts.push({
        type: "danger",
        title: "Collection rate under target",
        description: `Collection rate is ${collectionRate}%. Recommended target is above 80%.`,
      });
    }

    const recentInvoiceItems = recentInvoices.map((invoice) => ({
      id: invoice.id,
      createdAt: invoice.createdAt,
      period: `${invoice.month}/${invoice.year}`,
      status: invoice.status,
      tenantName: invoice.Tenant?.fullName || "N/A",
      roomName: invoice.Room?.name || "N/A",
      houseName: invoice.Room?.house?.name || "N/A",
      amount: toUsd(invoice.totalAmount || 0, exchangeRate, moneyScale),
    }));

    return res.json({
      year,
      availableYears,
      currency: "USD",
      exchangeRate,
      moneyScale,
      summary: {
        totalBoardingHouses,
        totalRooms,
        occupiedRooms,
        availableRooms,
        lockedRooms,
        totalTenants,
        yearRevenue,
        thisMonthRevenue,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        occupancyRate,
        collectionRate,
        avgRevenuePerPaidInvoice: toUsd(
          avgRevenuePerPaidInvoice,
          exchangeRate,
          moneyScale,
        ),
        outstandingAmount: toUsd(outstandingAmount, exchangeRate, moneyScale),
        yearRevenue: toUsd(yearRevenue, exchangeRate, moneyScale),
        thisMonthRevenue: toUsd(thisMonthRevenue, exchangeRate, moneyScale),
      },
      monthlyRevenue,
      invoiceStatusTrend,
      roomStatus: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        locked: lockedRooms,
      },
      costBreakdown: [
        {
          key: "room",
          label: "Room rent",
          amount: toUsd(roomCost, exchangeRate, moneyScale),
          percent: toPercent(roomCost),
        },
        {
          key: "electric",
          label: "Electricity",
          amount: toUsd(electricCost, exchangeRate, moneyScale),
          percent: toPercent(electricCost),
        },
        {
          key: "water",
          label: "Water",
          amount: toUsd(waterCost, exchangeRate, moneyScale),
          percent: toPercent(waterCost),
        },
        {
          key: "service",
          label: "Services",
          amount: toUsd(serviceCost, exchangeRate, moneyScale),
          percent: toPercent(serviceCost),
        },
      ],
      invoiceStatusSummary: {
        paid: paidInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices,
      },
      propertyPerformance,
      recentInvoices: recentInvoiceItems,
      alerts,
    });
  } catch (err) {
    console.error("getOwnerDashboard:", err);
    return res.status(500).json({ message: "Failed to load owner dashboard" });
  }
};
