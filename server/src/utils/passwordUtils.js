// src/utils/passwordUtils.js
// Utilities để hash và verify passwords

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hash password với bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Lỗi khi hash password:', error);
    throw new Error('Không thể mã hoá password');
  }
};

/**
 * Verify password với hash
 * @param {string} password - Plain text password cần kiểm tra
 * @param {string} hashedPassword - Hashed password từ database
 * @returns {Promise<boolean>} True nếu password đúng
 */
const verifyPassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Lỗi khi verify password:', error);
    throw new Error('Không thể kiểm tra password');
  }
};

module.exports = {
  hashPassword,
  verifyPassword
};
