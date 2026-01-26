import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/Admin/AdminSidebar.jsx";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar user={user} onLogout={handleLogout} />

      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
