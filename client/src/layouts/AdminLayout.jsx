import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/Admin/AdminSidebar.jsx";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token"); // nếu bạn dùng JWT
        const res = await axios.get(
          import.meta.env.VITE_API_URL + "/users/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(res.data);
      } catch (error) {
        console.log("Failed to fetch user", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      <AdminSidebar
        user={user}
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        mobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="lg:hidden sticky top-0 z-20 bg-gray-50/95 backdrop-blur border-b border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <span className="text-lg">☰</span>
            <span className="text-sm font-medium">Menu</span>
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
