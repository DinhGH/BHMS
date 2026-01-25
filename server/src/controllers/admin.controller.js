import { prisma } from "../lib/prisma.js";

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
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token không được gửi" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT_SECRET bạn dùng
    const userId = decoded.id;

    // Lấy user từ database, KHÔNG lấy passwordHash
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    res.status(200).json(user);
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};

/**
 * GET /api/users/dashboard
 * Dashboard data for admin overview
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const forceRefresh = req.query?.refresh === "true";
    if (!forceRefresh && Date.now() - dashboardCache.createdAt < CACHE_TTL_MS && dashboardCache.data) {
      return res.status(200).json(dashboardCache.data);
    }

    await seedSubscriptionsIfEmpty();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
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

    const totalUsers = userCounts.reduce((sum, item) => sum + item._count._all, 0);
    const activeUsers = userCounts.find((item) => item.status === "ACTIVE")?._count
      ._all ?? 0;

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
      0
    );

    const totalReports = reportCounts.reduce((sum, item) => sum + item._count._all, 0);
    const resolvedReports = reportCounts.find((item) => item.status === "RESOLVED")?._count
      ._all ?? 0;

    const reportAdminStatusCount = (status) =>
      reportAdminCounts.find((item) => item.status === status)?._count?._all ?? 0;
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

    const [recentSubscriptions, recentPayments, recentInvoices, recentReports, recentNotifications] =
      await Promise.all([
        prisma.subscription.findMany({
          orderBy: { purchasedAt: "desc" },
          take: 5,
        }),
        prisma.payment.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { invoice: { select: { id: true, room: { select: { name: true } } } } },
        }),
        prisma.invoice.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { room: { select: { name: true } } },
        }),
        prisma.report.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { sender: { select: { fullName: true } } },
        }),
        prisma.notification.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { title: true, createdAt: true },
        }),
      ]);

    const activityItems = [
      ...recentSubscriptions.map((subscription) => ({
        title: `Subscription ${subscription.plan} ${subscription.amount.toLocaleString("vi-VN")} VND`,
        createdAt: subscription.purchasedAt,
      })),
      ...recentPayments.map((payment) => ({
        title: `Payment ${payment.amount.toLocaleString("vi-VN")} VND for invoice #${payment.invoiceId}`,
        createdAt: payment.createdAt,
      })),
      ...recentInvoices.map((invoice) => ({
        title: `Invoice #${invoice.id} created for room ${invoice.room?.name ?? invoice.roomId}`,
        createdAt: invoice.createdAt,
      })),
      ...recentReports.map((report) => ({
        title: `Report from ${report.sender?.fullName ?? "user"}`,
        createdAt: report.createdAt,
      })),
      ...recentNotifications.map((notification) => ({
        title: `Notification: ${notification.title}`,
        createdAt: notification.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 4)
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
