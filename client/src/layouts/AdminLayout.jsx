import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/Admin/AdminSidebar.jsx";
import api from "../services/api.js";

export default function AdminLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await api("/api/users/me");
        setUser(user);
      } catch (error) {
        console.log("Failed to fetch user", error);
        console.log("Error response:", error.response?.data);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar user={user} />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
