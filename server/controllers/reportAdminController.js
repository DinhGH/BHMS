import { prisma } from "../lib/prisma.js";
import { sendReportAdminStatusEmail } from "../lib/mailer.js";

const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "10", 10), 1),
    100,
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getActorContext = async (req) => {
  if (!req.user?.id || !req.user?.role) return null;

  const role = req.user.role;
  if (role === "ADMIN") {
    return {
      role,
      userId: req.user.id,
      ownerId: null,
    };
  }

  if (role !== "OWNER") return null;

  const owner = await prisma.owner.findUnique({
    where: { userId: Number(req.user.id) },
    select: { id: true },
  });

  if (!owner) return null;

  return {
    role,
    userId: req.user.id,
    ownerId: owner.id,
  };
};

const isActionConfirmed = (req) => {
  const bodyConfirm = req.body?.confirm === true;
  const headerConfirm =
    String(req.headers["x-action-confirmed"] || "").toLowerCase() === "true";

  return bodyConfirm || headerConfirm;
};

const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const listReportAdmins = async (req, res) => {
  try {
    const actor = await getActorContext(req);
    if (!actor) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status, search, target, orderBy, order, senderId } = req.query;
    const { page, limit, skip } = parsePagination(req);

    const where = {};

    // Filter sender (hỗ trợ cả ownerId và userId)
    if (senderId) {
      const ownerId = await resolveOwnerIdFromSender(senderId);
      where.senderId = ownerId ?? -1; // -1 để không trả về tất cả
    }

    // Filter status
    if (status) {
      where.status = status;
    }

    // Filter target
    if (target && typeof target === "string") {
      where.target = {
        contains: target.trim(),
      };
    }

    // Search (nhẹ, không join owner để tránh tốn RAM MySQL)
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        {
          content: {
            contains: q,
          },
        },
        {
          target: {
            contains: q,
          },
        },
      ];
    }

    // OrderBy an toàn
    const allowedOrderBy = ["id", "createdAt"];
    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : "id";
    const safeOrder = order === "asc" ? "asc" : "desc";

    // Query song song (tối ưu hiệu năng)
    const [total, reports] = await Promise.all([
      prisma.reportAdmin.count({ where }),
      prisma.reportAdmin.findMany({
        where,
        skip,
        take: limit, // QUAN TRỌNG: luôn có take để tránh load full DB
        orderBy: {
          [safeOrderBy]: safeOrder,
        },
        select: {
          id: true,
          senderId: true,
          target: true,
          content: true,
          status: true,
          createdAt: true,
          // ❌ KHÔNG select images (Json base64 rất nặng)
        },
      }),
    ]);

    // Lấy danh sách senderId duy nhất
    const senderIds = [...new Set(reports.map((r) => r.senderId))];

    // Batch query owner + email (ĐÚNG theo schema: owner.user)
    const owners = senderIds.length
      ? await prisma.owner.findMany({
          where: {
            id: { in: senderIds },
          },
          select: {
            id: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        })
      : [];

    // Map owner theo id
    const ownerMap = new Map(owners.map((o) => [o.id, o]));

    // Gắn sender info vào report (để FE hiển thị history)
    const data = reports.map((report) => {
      const owner = ownerMap.get(report.senderId);

      return {
        ...report,
        sender: owner
          ? {
              id: owner.id,
              email: owner.user?.email ?? null, // ⚠️ đúng: user (không phải User)
            }
          : null,
      };
    });

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("listReportAdmins error:", error);
    return res.status(500).json({
      message: "Failed to fetch admin reports",
    });
  }
};

export const createReportAdmin = async (req, res) => {
  try {
    const actor = await getActorContext(req);
    if (!actor) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { senderId, senderEmail, target, content, images } = req.body || {};

    const senderIdNum = Number(senderId);
    const hasSenderId = Number.isFinite(senderIdNum) && senderIdNum > 0;
    const normalizedEmail =
      typeof senderEmail === "string" ? senderEmail.trim().toLowerCase() : "";

    if (!hasSenderId && !normalizedEmail) {
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
        Array.isArray(images) &&
        images.every((item) => typeof item === "string");
      if (!isStringArray) {
        return res
          .status(400)
          .json({ message: "Images must be an array of base64 strings" });
      }
    }
    let owner = null;
    let user = null;

    if (actor.role === "OWNER") {
      owner = await prisma.owner.findUnique({
        where: { id: actor.ownerId },
        select: { id: true },
      });
    }

    if (!owner && hasSenderId) {
      const ownerById = await prisma.owner.findUnique({
        where: { id: senderIdNum },
        select: { id: true },
      });

      const ownerByUserId = ownerById
        ? null
        : await prisma.owner.findUnique({
            where: { userId: senderIdNum },
            select: { id: true },
          });

      owner = ownerById || ownerByUserId;

      if (!owner) {
        user = await prisma.user.findUnique({
          where: { id: senderIdNum },
          select: { id: true, role: true, email: true },
        });
      }
    }

    if (!owner && normalizedEmail) {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, role: true, email: true },
      });
    }

    if (!owner && !user && normalizedEmail) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: "DEV_ONLY",
          role: "OWNER",
        },
        select: { id: true, role: true, email: true },
      });
    }

    if (!owner && user) {
      if (user.role !== "OWNER") {
        return res.status(403).json({ message: "User is not an owner" });
      }

      owner = await prisma.owner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!owner) {
        owner = await prisma.owner.create({
          data: { userId: user.id },
          select: { id: true },
        });
      }
    }

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const report = await prisma.reportAdmin.create({
      data: {
        senderId: owner.id,
        target: target.trim(),
        content: content.trim(),
        images: images ?? null,
      },
    });

    return res.status(201).json(report);
  } catch (error) {
    console.error("createReportAdmin error:", error);
    return res.status(500).json({ message: "Failed to create report" });
  }
};

const resolveOwnerIdFromSender = async (senderId) => {
  const senderIdNum = Number(senderId);
  if (!Number.isFinite(senderIdNum) || senderIdNum <= 0) return null;

  const ownerById = await prisma.owner.findUnique({
    where: { id: senderIdNum },
    select: { id: true },
  });

  const ownerByUserId = ownerById
    ? null
    : await prisma.owner.findUnique({
        where: { userId: senderIdNum },
        select: { id: true },
      });

  const owner = ownerById || ownerByUserId;
  return owner?.id ?? null;
};

export const updateReportAdmin = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const { senderId, target, content, images } = req.body || {};
    const hasUpdates =
      target !== undefined || content !== undefined || images !== undefined;
    if (!hasUpdates) {
      return res.status(400).json({ message: "No fields to update" });
    }

    if (target !== undefined && typeof target !== "string") {
      return res.status(400).json({ message: "Target must be a string" });
    }
    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length < 20) {
        return res
          .status(400)
          .json({ message: "Content must be at least 20 characters" });
      }
    }
    if (images !== undefined) {
      const isStringArray =
        Array.isArray(images) &&
        images.every((item) => typeof item === "string");
      if (images !== null && !isStringArray) {
        return res
          .status(400)
          .json({ message: "Images must be an array of base64 strings" });
      }
    }

    const report = await prisma.reportAdmin.findUnique({
      where: { id: reportId },
      select: { id: true, senderId: true },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (senderId !== undefined) {
      const ownerId = await resolveOwnerIdFromSender(senderId);
      if (!ownerId) {
        return res.status(404).json({ message: "Owner not found" });
      }
      if (report.senderId !== ownerId) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }

    const data = {};
    if (target !== undefined) data.target = target.trim();
    if (content !== undefined) data.content = content.trim();
    if (images !== undefined) data.images = images;

    const updated = await prisma.reportAdmin.update({
      where: { id: reportId },
      data,
    });

    return res.json(updated);
  } catch (error) {
    console.error("updateReportAdmin error:", error);
    return res.status(500).json({ message: "Failed to update report" });
  }
};

/**
 * GET /api/report-admins/:id
 * Lấy chi tiết một report của admin
 */
export const getReportAdmin = async (req, res) => {
  try {
    const actor = await getActorContext(req);
    if (!actor) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const reportId = Number(req.params.id);
    if (!Number.isFinite(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await prisma.reportAdmin.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (actor.role === "OWNER" && report.senderId !== actor.ownerId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const owner = await prisma.owner.findUnique({
      where: { id: report.senderId },
      select: {
        id: true,
        user: { select: { email: true } },
      },
    });

    res.json({
      ...report,
      sender: owner ? { id: owner.id, email: owner.user?.email } : null,
    });
  } catch (error) {
    console.error("getReportAdmin error:", error);
    res.status(500).json({ message: "Failed to fetch report" });
  }
};

/**
 * PATCH /api/report-admins/:id/status
 * Cập nhật status của report
 */
export const updateReportAdminStatus = async (req, res) => {
  try {
    if (!isActionConfirmed(req)) {
      return res.status(400).json({
        message: "Action confirmation is required",
      });
    }

    const reportId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isFinite(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "RESOLVED",
      "REVIEWING",
      "FIXING",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const report = await prisma.reportAdmin.findUnique({
      where: { id: reportId },
      include: {
        Owner: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const updatedReport = await prisma.reportAdmin.update({
      where: { id: reportId },
      data: { status },
    });

    const ownerUserId = report.Owner?.user?.id;
    if (Number.isFinite(ownerUserId)) {
      await prisma.notification.create({
        data: {
          userId: ownerUserId,
          title: "New update from admin",
          content: `Your report #${report.id} status was updated to ${status}.`,
        },
      });
    }

    const email = { attempted: 0, sent: 0, failed: 0 };
    const recipient = report.Owner?.user?.email;
    if (isValidEmail(recipient)) {
      email.attempted = 1;
      try {
        await sendReportAdminStatusEmail({
          to: recipient,
          ownerName: report.Owner?.user?.fullName || report.Owner?.user?.email,
          reportId: report.id,
          status,
          category: report.target,
          summary: report.content,
        });
        email.sent = 1;
      } catch (mailError) {
        email.failed = 1;
        console.error("sendReportAdminStatusEmail error:", {
          reportId,
          recipient,
          message: mailError?.message,
        });
      }
    }

    res.json({
      ...updatedReport,
      email,
    });
  } catch (error) {
    console.error("updateReportAdminStatus error:", error);
    res.status(500).json({ message: "Failed to update report status" });
  }
};

/**
 * DELETE /api/report-admins/:id
 * Xóa một report
 */
export const deleteReportAdmin = async (req, res) => {
  try {
    const actor = await getActorContext(req);
    if (!actor) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const reportId = Number(req.params.id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const report = await prisma.reportAdmin.findUnique({
      where: { id: reportId },
      select: { id: true, senderId: true },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (actor.role === "OWNER" && report.senderId !== actor.ownerId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.reportAdmin.delete({
      where: { id: reportId },
    });

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("deleteReportAdmin error:", error);
    res.status(500).json({ message: "Failed to delete report" });
  }
};
