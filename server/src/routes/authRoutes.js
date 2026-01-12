// src/routes/authRoutes.js
// Routes cho authentication (login, register, OAuth)

const express = require('express');
const passport = require('passport');
const {
  loginWithEmail,
  registerWithEmail,
  loginWithOAuth,
  getUserById
} = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/auth/register
 * Đăng ký bằng email + password
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName = '', phone = '' } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Email và password là bắt buộc')
      );
    }

    const result = await registerWithEmail(email, password, fullName, phone);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Lỗi trong POST /register:', error);
    return res.status(500).json(
      errorResponse('Lỗi server: ' + error.message)
    );
  }
});

/**
 * POST /api/auth/login
 * Đăng nhập bằng email + password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Email và password là bắt buộc')
      );
    }

    const result = await loginWithEmail(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi trong POST /login:', error);
    return res.status(500).json(
      errorResponse('Lỗi server: ' + error.message)
    );
  }
});

/**
 * GET /api/auth/google
 * Khởi tạo Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * GET /api/auth/google/callback
 * Callback sau khi user login bằng Google
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      // req.user được set bởi Passport
      const result = await loginWithOAuth(req.user, 'google');

      if (!result.success) {
        // Redirect về frontend với error message
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(result.message)}`
        );
      }

      // Redirect về frontend với token
      const token = result.token;
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth-success?token=${encodeURIComponent(token)}&provider=google`
      );
    } catch (error) {
      console.error('Lỗi trong Google callback:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Đăng nhập Google thất bại')}`
      );
    }
  }
);

/**
 * GET /api/auth/facebook
 * Khởi tạo Facebook OAuth flow
 */
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

/**
 * GET /api/auth/facebook/callback
 * Callback sau khi user login bằng Facebook
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res) => {
    try {
      // req.user được set bởi Passport
      const result = await loginWithOAuth(req.user, 'facebook');

      if (!result.success) {
        // Redirect về frontend với error message
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(result.message)}`
        );
      }

      // Redirect về frontend với token
      const token = result.token;
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth-success?token=${encodeURIComponent(token)}&provider=facebook`
      );
    } catch (error) {
      console.error('Lỗi trong Facebook callback:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Đăng nhập Facebook thất bại')}`
      );
    }
  }
);

/**
 * GET /api/auth/profile
 * Lấy thông tin profile của user hiện tại
 * Cần authentication
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json(
      successResponse('Lấy thông tin profile thành công', user)
    );
  } catch (error) {
    console.error('Lỗi trong GET /profile:', error);
    return res.status(500).json(
      errorResponse('Lỗi server: ' + error.message)
    );
  }
});

/**
 * POST /api/auth/logout
 * Logout - blacklist token and invalidate session
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json(
        errorResponse('Token không tìm thấy')
      );
    }

    // Decode token để lấy expiration time
    const jwtDecode = require('jsonwebtoken').decode;
    const decoded = jwtDecode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    // Add token to blacklist
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.tokenBlacklist.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });

    await prisma.$disconnect();

    return res.status(200).json(
      successResponse('Đăng xuất thành công')
    );
  } catch (error) {
    console.error('Lỗi trong POST /logout:', error);
    return res.status(500).json(
      errorResponse('Lỗi server: ' + error.message)
    );
  }
});

module.exports = router;
