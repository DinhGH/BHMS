import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/Admin/AdminSidebar.jsx";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
