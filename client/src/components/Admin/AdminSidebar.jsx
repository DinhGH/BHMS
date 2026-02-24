import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import SearchInput from "./SearchInput.jsx";
import { CiLogout } from "react-icons/ci";
import {
  FaTachometerAlt,
  FaUsers,
  FaBell,
  FaExclamationCircle,
} from "react-icons/fa";

import { AiFillSetting } from "react-icons/ai";
import { HiX } from "react-icons/hi";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminSidebar({ user, mobileOpen = false, onClose }) {
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const [notifications, setNotifications] = useState(2);
  const [search, setSearch] = useState("");

  const storedUser = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const rawUser = localStorage.getItem("user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }, []);

  const displayUser = user ?? authUser ?? storedUser;
  const displayName = displayUser?.name || displayUser?.email || "Nguyen Van A";
  const displayInitial = (displayUser?.name || displayUser?.email || "A")
    .charAt(0)
    .toUpperCase();
  const displayRole = displayUser?.role === "ADMIN" ? "Administrator" : "";

  const menuItems = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: <FaTachometerAlt className="h-6 w-6" />,
      end: true,
    },
    {
      to: "/admin/users",
      label: "Users",
      icon: <FaUsers className="h-6 w-6" />,
    },
    {
      to: "/admin/report",
      label: "Report",
      icon: <FaExclamationCircle className="w-6 h-6" />,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase().trim()),
  );

  // const handleSettings = () => {
  //   navigate("/admin/settings");
  // };
  const handleNotifications = () => {
    alert("You have " + notifications + " notifications!");
    setNotifications(0);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`bg-white shadow-lg flex flex-col transition-transform duration-200 fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw]
      ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:h-screen lg:w-64 lg:max-w-none`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">
                {displayInitial}
              </span>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-800 truncate">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {displayRole}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 lg:hidden"
            aria-label="Close sidebar"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          {/* <button
            className="p-2.5 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600"
            onClick={handleSettings}
            aria-label="Settings"
          >
            <AiFillSetting className="h-5 w-5" />
          </button> */}
          <button
            className="p-2.5 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600 relative"
            onClick={handleNotifications}
            aria-label="Notifications"
          >
            <FaBell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu..."
          />
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span className="text-xl text-gray-500 group-hover:text-gray-700">
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm">
            No matching menu items
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200"
        >
          <CiLogout className="w-6 h-6" />{" "}
          <span className="font-medium text-lg">Log out</span>
        </button>
      </div>
    </div>
  );
}
