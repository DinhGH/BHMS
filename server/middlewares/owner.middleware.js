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

    if (decoded.role !== "OWNER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 🔥 LẤY OWNER TỪ USER ID
    const owner = await prisma.owner.findUnique({
      where: { userId: decoded.id },
    });

    if (!owner) {
      return res.status(403).json({ message: "Owner profile not found" });
    }

    req.userId = decoded.id; // user.id
    req.ownerId = owner.id; // owner.id (dùng cho FK)

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
