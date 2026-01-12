// src/middleware/authMiddleware.js
// Middleware để verify JWT token

const { verifyToken } = require('../utils/jwtUtils');
const { errorResponse } = require('../utils/responseFormatter');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware để authenticate JWT token
 * Attach user info vào req.user nếu token hợp lệ
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json(
        errorResponse('Không tìm thấy token. Vui lòng đăng nhập')
      );
    }

    // Kiểm tra token có trong blacklist không
    const blacklistedToken = await prisma.tokenBlacklist.findUnique({
      where: { token }
    });

    if (blacklistedToken) {
      return res.status(401).json(
        errorResponse('Token đã bị vô hiệu hoá. Vui lòng đăng nhập lại')
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    // Lấy user info từ database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        active: true
      }
    });

    if (!user) {
      return res.status(404).json(errorResponse('User không tồn tại'));
    }

    if (user.active === 'NO') {
      return res.status(403).json(
        errorResponse('Tài khoản này đã bị vô hiệu hoá')
      );
    }

    // Attach user vào request
    req.user = user;
    next();
  } catch (error) {
    console.error('Lỗi khi authenticate token:', error);

    // Phân biệt giữa token hết hạn và token không hợp lệ
    if (error.message.includes('expired')) {
      return res.status(401).json(
        errorResponse('Token đã hết hạn. Vui lòng đăng nhập lại')
      );
    }

    return res.status(401).json(
      errorResponse('Token không hợp lệ')
    );
  }
};

module.exports = {
  authenticateToken
};
