import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to get user from localStorage
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Default user for development
        const defaultUser = {
          id: 1,
          name: "Owner Name",
          email: "owner@example.com",
          phone: "+84 912 345 678",
        };
        setUser(defaultUser);
      }
    } catch (err) {
      setError(err);
      const defaultUser = {
        id: 1,
        name: "Owner Name",
        email: "owner@example.com",
        phone: "+84 912 345 678",
      };
      setUser(defaultUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const setCurrentUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  return {
    user,
    loading,
    error,
    logout,
    setCurrentUser,
  };
}
