/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Khởi tạo user và token từ localStorage ngay từ đầu
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("rememberMe");
  };

  const updateUser = (partialUserData) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const mergedUser = { ...prevUser, ...partialUserData };
      localStorage.setItem("user", JSON.stringify(mergedUser));
      return mergedUser;
    });
  };

  const value = {
    user,
    token,
    loading: false,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
