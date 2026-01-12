// src/services/authService.js
// Service layer cho authentication logic

const { PrismaClient } = require('@prisma/client');
const { hashPassword, verifyPassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const prisma = new PrismaClient();

/**
 * Đăng nhập bằng email + password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Response object
 */
const loginWithEmail = async (email, password) => {
  try {
    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return errorResponse('Email hoặc password không chính xác');
    }

    // Kiểm tra password
    if (!user.passwordHash) {
      return errorResponse('Tài khoản này được đăng nhập bằng OAuth. Vui lòng sử dụng Google hoặc Facebook');
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse('Email hoặc password không chính xác');
    }

    // Kiểm tra tài khoản có active không
    if (user.active === 'NO') {
      return errorResponse('Tài khoản này đã bị vô hiệu hoá');
    }

    // Tạo JWT token
    const token = generateToken(user.id, user.email);

    // Trả về user info (không trả passwordHash)
    const userInfo = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      phone: user.phone,
      role: user.role
    };

    return successResponse('Đăng nhập thành công', userInfo, token);
  } catch (error) {
    console.error('Lỗi trong loginWithEmail:', error);
    return errorResponse('Lỗi server: ' + error.message);
  }
};

/**
 * Đăng ký bằng email + password
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 * @param {string} phone
 * @returns {Promise<object>} Response object
 */
const registerWithEmail = async (email, password, fullName = '', phone = '') => {
  try {
    // Kiểm tra email đã tồn tại
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return errorResponse('Email này đã được đăng ký');
    }

    // Validate password
    if (!password || password.length < 6) {
      return errorResponse('Password phải có ít nhất 6 ký tự');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Tạo user mới
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        phone,
        role: 'TENANT', // Mặc định role là TENANT
        status: 'NO_RENTING',
        active: 'YES',
        gender: '' // Để trống nếu không có
      }
    });

    // Tạo JWT token
    const token = generateToken(newUser.id, newUser.email);

    const userInfo = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone,
      role: newUser.role
    };

    return successResponse('Đăng ký thành công', userInfo, token);
  } catch (error) {
    console.error('Lỗi trong registerWithEmail:', error);
    return errorResponse('Lỗi server: ' + error.message);
  }
};

/**
 * Xử lý OAuth login - sử dụng provider field
 * @param {object} profile - OAuth profile từ Passport
 * @param {string} provider - 'google' hoặc 'facebook'
 * @returns {Promise<object>} User object
 */
const findOrCreateOAuthUser = async (profile, provider) => {
  try {
    // Lấy email từ profile
    const email = profile.emails?.[0]?.value || `${provider}_${profile.id}@bhms.local`;

    // Tìm user theo email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // Nếu user chưa tồn tại, tạo user mới
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          provider: provider, // Lưu provider là 'google' hoặc 'facebook'
          fullName: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
          avatar: profile.photos?.[0]?.value || null,
          role: 'TENANT', // Mặc định role
          status: 'NO_RENTING',
          active: 'YES',
          phone: '',
          gender: ''
        }
      });
    } else if (!user.provider) {
      // Nếu user đã tồn tại nhưng chưa có provider, update provider
      user = await prisma.user.update({
        where: { email },
        data: { provider }
      });
    }

    return user;
  } catch (error) {
    console.error('Lỗi trong findOrCreateOAuthUser:', error);
    throw error;
  }
};

/**
 * Đăng nhập/Đăng ký bằng OAuth
 * @param {object} profile - OAuth profile từ Passport
 * @param {string} provider - 'google' hoặc 'facebook'
 * @returns {Promise<object>} Response object
 */
const loginWithOAuth = async (profile, provider) => {
  try {
    // Find or create user
    const user = await findOrCreateOAuthUser(profile, provider);

    // Kiểm tra tài khoản có active không
    if (user.active === 'NO') {
      return errorResponse('Tài khoản này đã bị vô hiệu hoá');
    }

    // Tạo JWT token
    const token = generateToken(user.id, user.email);

    const userInfo = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      phone: user.phone,
      role: user.role
    };

    return successResponse(`Đăng nhập bằng ${provider} thành công`, userInfo, token);
  } catch (error) {
    console.error('Lỗi trong loginWithOAuth:', error);
    return errorResponse('Lỗi server: ' + error.message);
  }
};

/**
 * Lấy thông tin user từ ID
 * @param {number} userId
 * @returns {Promise<object>} User object hoặc null
 */
const getUserById = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    return user;
  } catch (error) {
    console.error('Lỗi trong getUserById:', error);
    return null;
  }
};

module.exports = {
  loginWithEmail,
  registerWithEmail,
  loginWithOAuth,
  findOrCreateOAuthUser,
  getUserById
};
