// src/utils/responseFormatter.js
// Format response thống nhất cho toàn bộ API

/**
 * Tạo response thành công
 * @param {string} message - Thông điệp
 * @param {any} data - Dữ liệu (optional)
 * @param {string} token - JWT token (optional)
 * @returns {object} Formatted response
 */
const successResponse = (message, data = null, token = null) => {
  const response = {
    success: true,
    message
  };

  if (data) {
    response.data = data;
  }

  if (token) {
    response.token = token;
  }

  return response;
};

/**
 * Tạo response lỗi
 * @param {string} message - Thông điệp lỗi
 * @param {any} data - Dữ liệu thêm (optional)
 * @returns {object} Formatted response
 */
const errorResponse = (message, data = null) => {
  const response = {
    success: false,
    message
  };

  if (data) {
    response.data = data;
  }

  return response;
};

module.exports = {
  successResponse,
  errorResponse
};
