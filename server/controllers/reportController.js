import { prisma } from "../lib/prisma.js";

const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const listReports = async (req, res) => {
  try {
    const { status, search, target, orderBy, order } = req.query;
    const { page, limit, skip } = parsePagination(req);

    const where = {};
    if (status) {
      where.status = status;
    }
    if (target) {
      where.target = target;
    }
    if (search) {
      const q = search.toString();
      const tenantMatches = await prisma.tenant.findMany({
        where: {
          OR: [
            { fullName: { contains: q } },
            { email: { contains: q } },
          ],
        },
        select: { id: true },
      });

      const senderIds = tenantMatches.map((t) => t.id);
      const orClauses = [{ content: { contains: q } }];
      if (senderIds.length > 0) {
        orClauses.push({ senderId: { in: senderIds } });
      }
      where.OR = orClauses;
    }

    const allowedOrderBy = ["id", "createdAt"];
    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : "createdAt";
    const safeOrder = order === "asc" ? "asc" : "desc";

    const [total, reports, unreadCount, processedCount] =
      await Promise.all([
        prisma.report.count({ where }),
        prisma.report.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [safeOrderBy]: safeOrder },
        }),
        prisma.report.count({ where: { status: "unread" } }),
        prisma.report.count({ where: { status: "processed" } }),
      ]);

    const senderIds = [...new Set(reports.map((r) => r.senderId))];
    const tenants = senderIds.length
      ? await prisma.tenant.findMany({
          where: { id: { in: senderIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const tenantById = new Map(tenants.map((t) => [t.id, t]));
    const reportsWithSender = reports.map((report) => {
      const tenant = tenantById.get(report.senderId);
      return {
        ...report,
        sender: tenant
          ? { id: tenant.id, fullName: tenant.fullName, email: tenant.email }
          : null,
      };
    });

    res.json({
      data: reportsWithSender,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        unread: unreadCount,
        processed: processedCount,
      },
    });
  } catch (error) {
    console.error("listReports error:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

export const getReportById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid report id" });

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) return res.status(404).json({ message: "Report not found" });

    const tenant = await prisma.tenant.findUnique({
      where: { id: report.senderId },
      select: { id: true, fullName: true, email: true },
    });

    res.json({
      ...report,
      sender: tenant
        ? { id: tenant.id, fullName: tenant.fullName, email: tenant.email }
        : null,
    });
  } catch (error) {
    console.error("getReportById error:", error);
    res.status(500).json({ message: "Failed to fetch report" });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!id) return res.status(400).json({ message: "Invalid report id" });
    if (!status || !["unread", "processed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: report.senderId },
      select: { id: true, fullName: true, email: true },
    });

    res.json({
      ...report,
      sender: tenant
        ? { id: tenant.id, fullName: tenant.fullName, email: tenant.email }
        : null,
    });
  } catch (error) {
    console.error("updateReportStatus error:", error);
    res.status(500).json({ message: "Failed to update report status" });
  }
};