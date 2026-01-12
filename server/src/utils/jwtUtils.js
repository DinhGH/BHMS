// src/utils/jwtUtils.js
// Utilities để tạo và verify JWT tokens

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRE = '7d'; // Token hết hạn sau 7 ngày

/**
 * Tạo JWT token cho user
 * @param {number} userId - ID của user
 * @param {string} email - Email của user
 * @returns {string} JWT token
 */
const generateToken = (userId, email) => {
  try {
    const token = jwt.sign(
      { id: userId, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );
    return token;
  } catch (error) {
    console.error('Lỗi khi tạo JWT:', error);
    throw new Error('Không thể tạo token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token cần verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Lỗi khi verify JWT:', error);
    throw new Error('Token không hợp lệ hoặc đã hết hạn');
  }
};

module.exports = {
  generateToken,
  verifyToken
};
