import { prisma } from "../lib/prisma.js";
import { sendTenantStatusEmail } from "../lib/mailer.js";

/**
 * ===== CONSTANTS =====
 */
const VALID_CLIENT_STATUS = ["REVIEWING", "FIXING", "FIXED"];
const ALLOWED_ORDER_BY = ["id", "createdAt"];

/**
 * Convert status giữa client và DB
 * DB: RESOLVED
 * Client: FIXED
 */
const toDbStatus = (status) => (status === "FIXED" ? "RESOLVED" : status);
const toClientStatus = (status) => (status === "RESOLVED" ? "FIXED" : status);

/**
 * Parse pagination an toàn
 */
const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "10", 10), 1),
    50,
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Helper: transform DB report -> API response
 */
const transformReport = (report) => {
  const { User, ...rest } = report;

  return {
    ...rest,
    status: toClientStatus(rest.status),
    sender: User
      ? {
          id: User.id,
          email: User.email,
        }
      : null,
  };
};

/**
 * =========================
 * LIST REPORTS
 * =========================
 */
export const listReports = async (req, res) => {
  try {
    const { status, search, target, orderBy, order } = req.query;
    const { page, limit, skip } = parsePagination(req);

    const where = {};

    // Filter status
    if (status && VALID_CLIENT_STATUS.includes(status)) {
      where.status = toDbStatus(status);
    }

    // Filter target
    if (target && typeof target === "string" && target.trim()) {
      where.target = target.trim();
    }

    // Search content + user email
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();

      where.OR = [
        {
          content: {
            contains: q,
          },
        },
        {
          User: {
            email: {
              contains: q,
            },
          },
        },
      ];
    }

    const safeOrderBy = ALLOWED_ORDER_BY.includes(orderBy)
      ? orderBy
      : "createdAt";

    const safeOrder = order === "asc" ? "asc" : "desc";

    const [total, reports, reviewingCount, fixingCount, fixedCount] =
      await Promise.all([
        prisma.report.count({ where }),

        prisma.report.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [safeOrderBy]: safeOrder,
          },
          include: {
            User: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        }),

        prisma.report.count({ where: { status: "REVIEWING" } }),
        prisma.report.count({ where: { status: "FIXING" } }),
        prisma.report.count({ where: { status: "RESOLVED" } }),
      ]);

    const data = reports.map(transformReport);

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        reviewing: reviewingCount,
        fixing: fixingCount,
        fixed: fixedCount,
      },
    });
  } catch (error) {
    console.error("listReports error:", error);
    return res.status(500).json({
      message: "Failed to fetch reports",
    });
  }
};

/**
 * =========================
 * CREATE REPORT
 * =========================
 */
export const createReport = async (req, res) => {
  try {
    const { senderId, senderEmail, target, content, images } = req.body || {};

    const senderIdNum = Number(senderId);
    const normalizedEmail =
      typeof senderEmail === "string" ? senderEmail.trim().toLowerCase() : "";

    if (!senderIdNum && !normalizedEmail) {
      return res
        .status(400)
        .json({ message: "senderId or senderEmail is required" });
    }

    if (!target || typeof target !== "string" || !target.trim()) {
      return res.status(400).json({ message: "Target is required" });
    }

    if (!content || typeof content !== "string" || content.trim().length < 20) {
      return res
        .status(400)
        .json({ message: "Content must be at least 20 characters" });
    }

    if (images !== null && images !== undefined) {
      const isStringArray =
        Array.isArray(images) &&
        images.every((item) => typeof item === "string");

      if (!isStringArray) {
        return res.status(400).json({
          message: "Images must be an array of base64 strings",
        });
      }
    }

    let user = null;

    if (senderIdNum) {
      user = await prisma.user.findUnique({
        where: { id: senderIdNum },
        select: { id: true, email: true },
      });
    }

    if (!user && normalizedEmail) {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true },
      });
    }

    if (!user && normalizedEmail) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: "DEV_ONLY",
          role: "TENANT",
        },
        select: { id: true, email: true },
      });
    }

    if (!user) {
      return res.status(404).json({ message: "Sender not found" });
    }

    const report = await prisma.report.create({
      data: {
        senderId: user.id,
        target: target.trim(),
        content: content.trim(),
        images: images ?? null,
        status: "REVIEWING",
      },
      include: {
        User: {
          select: { id: true, email: true },
        },
      },
    });

    return res.status(201).json(transformReport(report));
  } catch (error) {
    console.error("createReport error:", error);
    return res.status(500).json({
      message: "Failed to create report",
    });
  }
};

/**
 * =========================
 * GET REPORT BY ID
 * =========================
 */
export const getReportById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid report id" });

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, email: true },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json(transformReport(report));
  } catch (error) {
    console.error("getReportById error:", error);
    return res.status(500).json({
      message: "Failed to fetch report",
    });
  }
};

/**
 * =========================
 * UPDATE REPORT STATUS
 * =========================
 */
export const updateReportStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!id) return res.status(400).json({ message: "Invalid report id" });

    if (!status || !VALID_CLIENT_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const dbStatus = toDbStatus(status);

    const report = await prisma.report.update({
      where: { id },
      data: { status: dbStatus },
      include: {
        User: {
          select: { id: true, email: true },
        },
      },
    });

    let emailResult = null;

    if (report.User?.email && ["FIXING", "FIXED"].includes(status)) {
      try {
        emailResult = await sendTenantStatusEmail({
          to: report.User.email,
          reportId: report.id,
          status,
        });
      } catch (err) {
        emailResult = { sent: false };
      }
    }

    return res.json({
      ...transformReport(report),
      email: emailResult,
    });
  } catch (error) {
    console.error("updateReportStatus error:", error);
    return res.status(500).json({
      message: "Failed to update report status",
    });
  }
};
export const updateReport = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { target, content, images } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const data = {};

    if (typeof target === "string" && target.trim()) {
      data.target = target.trim();
    }

    if (typeof content === "string") {
      if (content.trim().length < 20) {
        return res
          .status(400)
          .json({ message: "Content must be at least 20 characters" });
      }
      data.content = content.trim();
    }

    if (images !== undefined) {
      if (images !== null) {
        const isStringArray =
          Array.isArray(images) &&
          images.every((item) => typeof item === "string");

        if (!isStringArray) {
          return res.status(400).json({
            message: "Images must be an array of base64 strings",
          });
        }
      }
      data.images = images;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const report = await prisma.report.update({
      where: { id },
      data,
      include: {
        User: {
          select: { id: true, email: true },
        },
      },
    });

    return res.json(transformReport(report));
  } catch (error) {
    console.error("updateReport error:", error);
    return res.status(500).json({
      message: "Failed to update report",
    });
  }
};
/**
 * =========================
 * DELETE REPORT
 * =========================
 */
export const deleteReport = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid report id" });

    await prisma.report.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("deleteReport error:", error);
    return res.status(500).json({
      message: "Failed to delete report",
    });
  }
};
