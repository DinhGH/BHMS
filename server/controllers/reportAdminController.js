import { prisma } from "../lib/prisma.js";

const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const listReportAdmins = async (req, res) => {
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
      const ownerMatches = await prisma.owner.findMany({
        where: {
          user: {
            email: { contains: q },
          },
        },
        select: { id: true },
      });

      const senderIds = ownerMatches.map((o) => o.id);
      const orClauses = [{ content: { contains: q } }];
      if (senderIds.length > 0) {
        orClauses.push({ senderId: { in: senderIds } });
      }
      where.OR = orClauses;
    }

    const allowedOrderBy = ["id", "createdAt"];
    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : "createdAt";
    const safeOrder = order === "asc" ? "asc" : "desc";

    const [total, reports] = await Promise.all([
      prisma.reportAdmin.count({ where }),
      prisma.reportAdmin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeOrderBy]: safeOrder },
      }),
    ]);

    const senderIds = [...new Set(reports.map((r) => r.senderId))];
    const owners = senderIds.length
      ? await prisma.owner.findMany({
          where: { id: { in: senderIds } },
          select: {
            id: true,
            user: { select: { email: true } },
          },
        })
      : [];
    const ownerById = new Map(owners.map((o) => [o.id, o]));
    const reportsWithSender = reports.map((report) => {
      const owner = ownerById.get(report.senderId);
      return {
        ...report,
        sender: owner
          ? { id: owner.id, email: owner.user?.email ?? null }
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
    });
  } catch (error) {
    console.error("listReportAdmins error:", error);
    res.status(500).json({ message: "Failed to fetch admin reports" });
  }
};

export const createReportAdmin = async (req, res) => {
  try {
    const { senderId, senderEmail, target, content, images } = req.body || {};

    const senderIdNum = Number(senderId);
    const hasSenderId = Number.isFinite(senderIdNum) && senderIdNum > 0;
    const normalizedEmail = typeof senderEmail === "string"
      ? senderEmail.trim().toLowerCase()
      : "";

    if (!hasSenderId && !normalizedEmail) {
      return res.status(400).json({ message: "senderId or senderEmail is required" });
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
    let owner = null;
    let user = null;

    if (hasSenderId) {
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
