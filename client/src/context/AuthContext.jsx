// client/src/context/AuthContext.jsx
// Context để quản lý authentication state

import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getCurrentUser, isAuthenticated, logout as logoutService } from '../utils/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Load user data từ localStorage khi component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedToken = getToken();
        const storedUser = getCurrentUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Lỗi khi load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Login function
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setIsLoggedIn(true);
  };

  // Logout function - cấp thấp, chỉ reset state
  const contextLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset state
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
  };

  // Logout function - cấp cao, gọi API server
  const logout = async () => {
    await logoutService(navigate, contextLogout);
  };

  // Update user function
  const updateUser = (updatedData) => {
    setUser({
      ...user,
      ...updatedData
    });
  };

  const value = {
    user,
    token,
    isLoading,
    isLoggedIn,
    login,
    logout,
    updateUser,
    isAuthenticated: isAuthenticated()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
