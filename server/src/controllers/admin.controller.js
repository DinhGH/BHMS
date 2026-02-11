import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import pkg from "@prisma/client";
import jwt from "jsonwebtoken";

const { Role, User_status, User_active } = pkg;

/**
 * GET /api/users
 * Lấy danh sách user
 */
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const formatActivityTime = (date) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);

const CACHE_TTL_MS = 30_000;
const dashboardCache = {
  data: null,
  createdAt: 0,
};

const seedSubscriptionsIfEmpty = async () => {
  const total = await prisma.subscription.count();
  if (total > 0) {
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const planPrices = {
    BASIC: 199_000,
    PREMIUM: 399_000,
    PROFESSIONAL: 699_000,
  };

  const planKeys = Object.keys(planPrices);
  const data = [];

  for (let month = 0; month < 12; month += 1) {
    const baseDay = 4 + (month % 5);
    Object.entries(planPrices).forEach(([plan, amount], idx) => {
      const purchaseDate = new Date(year, month, baseDay + idx);
      const periodStart = new Date(year, month, baseDay + idx);
      const periodEnd = new Date(year, month + 1, baseDay + idx);

      data.push({
        plan,
        amount,
        currency: "VND",
        status: "ACTIVE",
        purchasedAt: purchaseDate,
        periodStart,
        periodEnd,
      });
    });

    const extraCount = month % 4;
    for (let extra = 0; extra < extraCount; extra += 1) {
      const plan = planKeys[(month + extra) % planKeys.length];
      const amount = planPrices[plan];
      const purchaseDate = new Date(year, month, 18 + extra);
      const periodStart = new Date(year, month, 18 + extra);
      const periodEnd = new Date(year, month + 1, 18 + extra);

      data.push({
        plan,
        amount,
        currency: "VND",
        status: "ACTIVE",
        purchasedAt: purchaseDate,
        periodStart,
        periodEnd,
      });
    }
  }

  await prisma.subscription.createMany({ data });
};

/**
 * GET /api/user/me
 * Lấy thông tin user hiện tại dựa vào token
 */
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header không hợp lệ" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        active: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("getCurrentUser error:", err.message);
    return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};

/**
 * PATCH /api/users/:id
 * Block / Unblock user
 */
export const updateUserStatus = async (req, res) => {
  const userId = Number(req.params.id);
  const { status } = req.body;

  if (!["ACTIVE", "BLOCKED"].includes(status)) {
    return res.status(400).json({
      message: "Status không hợp lệ",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status, updatedAt: new Date() },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    return res.status(200).json({
      message: "Cập nhật trạng thái thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateUserStatus error:", error);
    return res.status(500).json({
      message: "Không thể cập nhật trạng thái user",
    });
  }
};

/**
 * DELETE /api/users
 */
export const deleteUsers = async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: "No users selected" });
  }

  try {
    // Delete dependent rows first to avoid FK constraint errors.
    await prisma.$transaction([
      prisma.owner.deleteMany({ where: { userId: { in: ids } } }),
      prisma.licenseKey.deleteMany({ where: { userId: { in: ids } } }),
      prisma.notification.deleteMany({ where: { userId: { in: ids } } }),
      prisma.report.deleteMany({ where: { senderId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);

    return res.json({ message: "Delete users success" });
  } catch (err) {
    console.error("deleteUsers error:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
};

/**
 * POST /api/users/add
 */
export const addUser = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      provider,
      role = "TENANT",
      status = "ACTIVE",
      active = "YES",
    } = req.body;

    // ===== VALIDATE EMAIL =====
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const blockedDomains = [
      "mailinator.com",
      "10minutemail.com",
      "tempmail.com",
      "guerrillamail.com",
    ];

    const domain = email.split("@")[1];
    if (blockedDomains.includes(domain)) {
      return res.status(400).json({
        message: "Temporary email is not allowed",
      });
    }

    // ===== VALIDATE PASSWORD =====
    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\S]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include uppercase, lowercase, number, special character and no spaces",
      });
    }

    // ===== CHECK EXIST =====
    const existedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existedUser) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    // ===== CREATE USER =====
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        provider,
        role,
        status,
        active,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        active: true,
        createdAt: true,
      },
    });

    if (newUser.role === "OWNER") {
      await prisma.owner.upsert({
        where: { userId: newUser.id },
        update: {},
        create: { userId: newUser.id },
      });
    }

    return res.status(201).json({
      message: "Create user success",
      user: newUser,
    });
  } catch (err) {
    console.error("addUser error:", err);
    return res.status(500).json({
      message: "Create user failed",
    });
  }
};

/**
 * PUT /api/users/:id
 * Cập nhật thông tin user (admin)
 */
export const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const {
      email,
      password,
      fullName,
      provider,
      role = "TENANT",
      status = "ACTIVE",
      active = "YES",
    } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    const data = {};

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      const existed = await prisma.user.findUnique({ where: { email } });
      if (existed && existed.id !== userId) {
        return res.status(409).json({ message: "Email already exists" });
      }
      data.email = email;
    }

    if (fullName) data.fullName = fullName;
    if (provider) data.provider = provider;
    if (role) data.role = role;
    if (status) data.status = status;
    if (active) data.active = active;

    if (password) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\S]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters, include uppercase, lowercase, number, special character and no spaces",
        });
      }
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    data.updatedAt = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        active: true,
        createdAt: true,
      },
    });

    if (updatedUser.role === "OWNER") {
      await prisma.owner.upsert({
        where: { userId: updatedUser.id },
        update: {},
        create: { userId: updatedUser.id },
      });
    }

    return res
      .status(200)
      .json({ message: "Update user success", user: updatedUser });
  } catch (err) {
    console.error("updateUser error:", err);
    return res.status(500).json({ message: "Update user failed" });
  }
};

/**
 * GET /api/users/dashboard
 * Dashboard data for admin overview
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const forceRefresh = req.query?.refresh === "true";
    if (
      !forceRefresh &&
      Date.now() - dashboardCache.createdAt < CACHE_TTL_MS &&
      dashboardCache.data
    ) {
      return res.status(200).json(dashboardCache.data);
    }

    await seedSubscriptionsIfEmpty();

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    const [
      userCounts,
      totalRooms,
      bookingsToday,
      roomsWithInvoices,
      reportCounts,
      reportAdminCounts,
      totalTenants,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.room.count(),
      prisma.subscription.count({
        where: { purchasedAt: { gte: startOfToday, lt: startOfTomorrow } },
      }),
      prisma.invoice.groupBy({
        by: ["roomId"],
        where: { month: now.getMonth() + 1, year: now.getFullYear() },
      }),
      prisma.report.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.reportAdmin.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.tenant.count(),
    ]);

    const totalUsers = userCounts.reduce(
      (sum, item) => sum + item._count._all,
      0,
    );
    const activeUsers =
      userCounts.find((item) => item.status === "ACTIVE")?._count._all ?? 0;

    const activePct = totalUsers
      ? Math.round((activeUsers / totalUsers) * 100)
      : 0;
    const inactivePct = 100 - activePct;

    const revenueByMonth = Array.from({ length: 12 }, (_, idx) => ({
      month: `M${idx + 1}`,
      value: 0,
    }));

    const revenueRows = await prisma.$queryRaw`
      SELECT MONTH(purchasedAt) AS month, SUM(amount) AS total
      FROM \`Subscription\`
      WHERE status = 'ACTIVE'
        AND purchasedAt >= ${startOfYear}
        AND purchasedAt < ${endOfYear}
      GROUP BY MONTH(purchasedAt)
    `;

    revenueRows.forEach((row) => {
      const monthIndex = Number(row.month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        revenueByMonth[monthIndex].value =
          Math.round((Number(row.total || 0) / 1_000_000) * 10) / 10;
      }
    });

    const monthlyRevenueAgg = await prisma.subscription.aggregate({
      where: {
        status: "ACTIVE",
        purchasedAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    });

    const monthlyRevenue = monthlyRevenueAgg._sum.amount ?? 0;

    const totalAnnualRevenue = revenueByMonth.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    const totalReports = reportCounts.reduce(
      (sum, item) => sum + item._count._all,
      0,
    );
    const resolvedReports =
      reportCounts.find((item) => item.status === "RESOLVED")?._count._all ?? 0;

    const reportAdminStatusCount = (status) =>
      reportAdminCounts.find((item) => item.status === status)?._count?._all ??
      0;
    const reportAdminSummary = {
      reviewing: reportAdminStatusCount("REVIEWING"),
      fixing: reportAdminStatusCount("FIXING"),
      fixed: reportAdminStatusCount("RESOLVED"),
    };

    const returningCustomersRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS count
      FROM (
        SELECT tenantId
        FROM \`Invoice\`
        WHERE createdAt >= ${startOfYear}
        GROUP BY tenantId
        HAVING COUNT(*) >= 2
      ) AS t
    `;
    const returningCustomers = Number(returningCustomersRows?.[0]?.count ?? 0);

    const occupancyRate = totalRooms
      ? Math.round((roomsWithInvoices.length / totalRooms) * 100)
      : 0;
    const fiveStarRatings = totalReports
      ? Math.round((resolvedReports / totalReports) * 100)
      : 0;
    const returningCustomersRate = totalTenants
      ? Math.round((returningCustomers / totalTenants) * 100)
      : 0;

    const [
      recentSubscriptions,
      recentPayments,
      recentInvoices,
      recentReports,
      recentNotifications,
    ] = await Promise.all([
      prisma.subscription.findMany({
        orderBy: { purchasedAt: "desc" },
        take: 5,
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          Invoice: { 
            select: { 
              id: true, 
              Room: { select: { name: true } } 
            } 
          },
        },
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { 
          Room: { select: { name: true } } 
        },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { 
          User: { select: { fullName: true, email: true } } 
        },
      }),
      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { 
          title: true, 
          createdAt: true,
          User: { select: { fullName: true } }
        },
      }),
    ]);

    const activityItems = [
      ...recentSubscriptions.map((subscription) => ({
        title: `Subscription ${subscription.plan} - ${subscription.amount.toLocaleString("vi-VN")} VND`,
        createdAt: subscription.purchasedAt,
      })),
      ...recentPayments.map((payment) => ({
        title: `Payment ${payment.amount.toLocaleString("vi-VN")} VND - ${payment.Invoice?.Room?.name ?? `Invoice #${payment.invoiceId}`}`,
        createdAt: payment.createdAt,
      })),
      ...recentInvoices.map((invoice) => ({
        title: `Invoice #${invoice.id} - ${invoice.Room?.name ?? `Room ${invoice.roomId}`}`,
        createdAt: invoice.createdAt,
      })),
      ...recentReports.map((report) => ({
        title: `Report từ ${report.User?.fullName ?? report.User?.email ?? "user"}`,
        createdAt: report.createdAt,
      })),
      ...recentNotifications.map((notification) => ({
        title: notification.title,
        createdAt: notification.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((item) => ({
        title: item.title,
        time: formatActivityTime(item.createdAt),
      }));

    const response = {
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        activePct,
        inactivePct,
        bookingsToday,
        monthlyRevenue: Math.round(monthlyRevenue / 1_000_000),
      },
      revenueByMonth,
      totalAnnualRevenue,
      recentActivity: activityItems,
      reportAdminSummary,
      goals: {
        occupancyRate,
        fiveStarRatings,
        returningCustomers: returningCustomersRate,
      },
    };

    dashboardCache.data = response;
    dashboardCache.createdAt = Date.now();

    return res.status(200).json(response);
  } catch (err) {
    console.error("getAdminDashboard error:", err);
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
};
