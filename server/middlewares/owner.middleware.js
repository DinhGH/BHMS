import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const authOwner = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decodedUserId = Number(decoded.id ?? decoded.userId ?? decoded.sub);

    if (decoded.role !== "OWNER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    let user = null;

    if (!Number.isNaN(decodedUserId)) {
      user = await prisma.user.findUnique({
        where: { id: decodedUserId },
        select: { id: true, email: true, role: true, status: true, active: true },
      });
    }

    if (!user && decoded.email) {
      user = await prisma.user.findUnique({
        where: { email: String(decoded.email).trim().toLowerCase() },
        select: { id: true, email: true, role: true, status: true, active: true },
      });
    }

    if (!user || user.role !== "OWNER") {
      return res.status(403).json({ message: "Owner account not found" });
    }

    if (user.status === "BLOCKED" || user.active === "NO") {
      return res.status(403).json({ message: "Owner account is inactive" });
    }

    let owner = await prisma.owner.findUnique({
      where: { userId: user.id },
    });

    if (!owner) {
      owner = await prisma.owner.create({
        data: { userId: user.id },
      });
    }

    req.userId = user.id; // user.id
    req.ownerId = owner.id; // owner.id (dùng cho FK)

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
