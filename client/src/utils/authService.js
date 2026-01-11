// API endpoint
const API_URL = 'http://localhost:5000/api/auth';

/**
 * Logout user
 * - Gọi API logout trên server
 * - Xóa token và user info từ localStorage
 * - Chuyển hướng về trang login
 */
export const logout = async (navigate) => {
  try {
    const token = localStorage.getItem('token');

    if (token) {
      // Gọi API logout trên server
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
    }

    // Xóa token và user info từ localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');

    // Chuyển hướng về trang login
    navigate('/login');
  } catch (error) {
    console.error('Logout error:', error);
    // Vẫn xóa token ngay cả nếu API gặp lỗi
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    navigate('/login');
  }
};

/**
 * Lấy token hiện tại từ localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Lấy thông tin user hiện tại từ localStorage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Kiểm tra user có đang đăng nhập không
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
