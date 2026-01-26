import { prisma } from "../lib/prisma.js";
import { sendTenantStatusEmail } from "../lib/mailer.js";

const toDbStatus = (status) => (status === "FIXED" ? "RESOLVED" : status);
const toClientStatus = (status) => (status === "RESOLVED" ? "FIXED" : status);

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
      where.status = toDbStatus(status);
    }
    if (target) {
      where.target = target;
    }
    if (search) {
      const q = search.toString();
      const userMatches = await prisma.user.findMany({
        where: {
          email: { contains: q },
        },
        select: { id: true },
      });

      const senderIds = userMatches.map((u) => u.id);
      const orClauses = [{ content: { contains: q } }];
      if (senderIds.length > 0) {
        orClauses.push({ senderId: { in: senderIds } });
      }
      where.OR = orClauses;
    }

    const allowedOrderBy = ["id", "createdAt"];
    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : "createdAt";
    const safeOrder = order === "asc" ? "asc" : "desc";

    const [total, reports, reviewingCount, fixingCount, fixedCount] =
      await Promise.all([
        prisma.report.count({ where }),
        prisma.report.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [safeOrderBy]: safeOrder },
        }),
        prisma.report.count({ where: { status: "REVIEWING" } }),
        prisma.report.count({ where: { status: "FIXING" } }),
        prisma.report.count({ where: { status: "RESOLVED" } }),
      ]);

    const senderIds = [...new Set(reports.map((r) => r.senderId))];
    const users = senderIds.length
      ? await prisma.user.findMany({
          where: { id: { in: senderIds } },
          select: { id: true, email: true },
        })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));
    const reportsWithSender = reports.map((report) => {
      const user = userById.get(report.senderId);
      return {
        ...report,
        status: toClientStatus(report.status),
        sender: user ? { id: user.id, email: user.email } : null,
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
        reviewing: reviewingCount,
        fixing: fixingCount,
        fixed: fixedCount,
      },
    });
  } catch (error) {
    console.error("listReports error:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

export const createReport = async (req, res) => {
  try {
    const { senderId, senderEmail, target, content, images } = req.body || {};
    const senderIdNum = Number(senderId);
    const normalizedEmail = typeof senderEmail === "string"
      ? senderEmail.trim().toLowerCase()
      : "";

    if (!senderIdNum && !normalizedEmail) {
      return res
        .status(400)
        .json({ message: "senderId or senderEmail is required" });
    }
    if (!target || typeof target !== "string") {
      return res.status(400).json({ message: "Target is required" });
    }
    if (!content || typeof content !== "string" || content.trim().length < 20) {
      return res
        .status(400)
        .json({ message: "Content must be at least 20 characters" });
    }
    if (images !== null && images !== undefined) {
      const isStringArray =
        Array.isArray(images) && images.every((item) => typeof item === "string");
      if (!isStringArray) {
        return res
          .status(400)
          .json({ message: "Images must be an array of base64 strings" });
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
    });

    return res.status(201).json({
      ...report,
      status: toClientStatus(report.status),
      sender: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("createReport error:", error);
    return res.status(500).json({ message: "Failed to create report" });
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

    const user = await prisma.user.findUnique({
      where: { id: report.senderId },
      select: { id: true, email: true },
    });

    res.json({
      ...report,
      status: toClientStatus(report.status),
      sender: user ? { id: user.id, email: user.email } : null,
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
    const dbStatus = toDbStatus(status);

    if (!id) return res.status(400).json({ message: "Invalid report id" });
    if (!status || !["REVIEWING", "FIXING", "FIXED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status: dbStatus },
    });

    const user = await prisma.user.findUnique({
      where: { id: report.senderId },
      select: { id: true, email: true },
    });

    let emailResult = null;
    if (user?.email && ["FIXING", "FIXED"].includes(status)) {
      try {
        emailResult = await sendTenantStatusEmail({
          to: user.email,
          reportId: report.id,
          status,
        });
      } catch (emailError) {
        console.error("sendTenantStatusEmail error:", emailError);
        emailResult = { sent: false, error: "Email failed" };
      }
    }

    res.json({
      ...report,
      status: toClientStatus(report.status),
      sender: user ? { id: user.id, email: user.email } : null,
      email: emailResult,
    });
  } catch (error) {
    console.error("updateReportStatus error:", error);
    res.status(500).json({ message: "Failed to update report status" });
  }
};

export const updateReport = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { target, content, images } = req.body || {};

    if (!id) return res.status(400).json({ message: "Invalid report id" });

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
          Array.isArray(images) && images.every((item) => typeof item === "string");
        if (!isStringArray) {
          return res
            .status(400)
            .json({ message: "Images must be an array of base64 strings" });
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
    });

    const user = await prisma.user.findUnique({
      where: { id: report.senderId },
      select: { id: true, email: true },
    });

    res.json({
      ...report,
      status: toClientStatus(report.status),
      sender: user ? { id: user.id, email: user.email } : null,
    });
  } catch (error) {
    console.error("updateReport error:", error);
    res.status(500).json({ message: "Failed to update report" });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid report id" });

    await prisma.report.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("deleteReport error:", error);
    res.status(500).json({ message: "Failed to delete report" });
  }
};