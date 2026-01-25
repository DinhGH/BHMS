import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/Admin/AdminSidebar.jsx";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminLayout() {
  const [user, setUser] = useState(null);

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
          },
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
      <AdminSidebar user={user} />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
