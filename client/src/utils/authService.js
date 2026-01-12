// API endpoint
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Đăng ký bằng email + password
 */
export const registerUser = async (email, password, firstName = '', lastName = '') => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName
      })
    });

    const data = await response.json();

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data));
    }

    return data;
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    return {
      success: false,
      message: 'Lỗi kết nối server'
    };
  }
};

/**
 * Đăng nhập bằng email + password
 */
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data));
    }

    return data;
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    return {
      success: false,
      message: 'Lỗi kết nối server'
    };
  }
};

/**
 * Đăng nhập bằng Google
 */
export const loginWithGoogle = () => {
  window.location.href = `${API_URL}/auth/google`;
};

/**
 * Đăng nhập bằng Facebook
 */
export const loginWithFacebook = () => {
  window.location.href = `${API_URL}/auth/facebook`;
};

/**
 * Xử lý OAuth callback - gọi sau khi redirect từ Google/Facebook
 */
export const handleOAuthCallback = (token, userData) => {
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    return {
      success: true,
      message: 'Đăng nhập OAuth thành công'
    };
  }
  return {
    success: false,
    message: 'Lỗi OAuth callback'
  };
};

/**
 * Lấy profile user hiện tại
 */
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        success: false,
        message: 'Chưa đăng nhập'
      };
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy profile:', error);
    return {
      success: false,
      message: 'Lỗi kết nối server'
    };
  }
};

/**
 * Logout user - gọi API server để invalidate token
 * @param {function} navigate - React Router navigate function (optional)
 * @param {function} contextLogout - Context logout function (optional) 
 * @returns {Promise<object>} Response object
 */
export const logout = async (navigate = null, contextLogout = null) => {
  try {
    const token = localStorage.getItem('token');

    // Call server logout endpoint
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Call context logout if provided
    if (contextLogout && typeof contextLogout === 'function') {
      contextLogout();
    }

    // Navigate to login if function provided
    if (navigate && typeof navigate === 'function') {
      navigate('/login');
    }

    return {
      success: true,
      message: 'Đăng xuất thành công'
    };
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
    
    // Always clear local data even if API call fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Call context logout if provided
    if (contextLogout && typeof contextLogout === 'function') {
      contextLogout();
    }
    
    // Navigate to login if function provided
    if (navigate && typeof navigate === 'function') {
      navigate('/login');
    }

    return {
      success: true,
      message: 'Đăng xuất thành công (local)'
    };
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
