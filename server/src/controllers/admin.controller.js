import { prisma } from "../lib/prisma.js";

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
