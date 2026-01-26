import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/Admin/AdminSidebar.jsx";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar user={user} />

      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
