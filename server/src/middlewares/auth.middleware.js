import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

//  protectedRoute(["ADMIN", "OWNER", "TENANT"])

export const protectedRoute = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Lấy token từ header
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Không tìm thấy access token" });
      }

      //  Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // Lấy user từ Prisma
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      // Check tài khoản bị khóa
      if (user.status === "BLOCKED") {
        return res.status(403).json({ message: "Tài khoản đã bị khóa" });
      }

      //  Check role (nếu có truyền vào)
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Không có quyền truy cập" });
      }

      // Gắn user vào req
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  };
};
