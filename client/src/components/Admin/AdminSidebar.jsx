import React, { useState } from "react";
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
import {
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiX,
} from "react-icons/hi";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminSidebar({
  user,
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onClose,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(2);
  const [search, setSearch] = useState("");

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

  const handleSettings = () => {
    navigate("/admin/settings");
  };
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
      className={`bg-white shadow-lg flex flex-col transition-all duration-200 fixed inset-y-0 left-0 z-40 w-64
      ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static
      ${collapsed ? "lg:w-20" : "lg:w-64"}`}
    >
      {/* Header */}
      <div className={`border-b border-gray-200 ${collapsed ? "p-4" : "p-6"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            {!collapsed && (
              <div>
                <div className="font-bold text-gray-800">
                  {user?.name || "Nguyen Van A"}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.role === "ADMIN" ? "Administrator" : ""}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 lg:hidden"
              aria-label="Close sidebar"
            >
              <HiX className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hidden lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <HiChevronDoubleRight className="h-5 w-5" />
              ) : (
                <HiChevronDoubleLeft className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-4 mb-4 ${collapsed ? "justify-center" : ""}`}>
          <button
            className="p-2 hover:bg-gray-100 rounded-full"
            onClick={handleSettings}
          >
            <AiFillSetting className="h-6 w-6" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full relative"
            onClick={handleNotifications}
          >
            <FaBell className="h-6 w-6" />
            {notifications > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="flex">
            <div className="w-full">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className={`flex-1 ${collapsed ? "p-3" : "p-4"}`}>
        {filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 ${
                  collapsed ? "justify-center px-3" : "px-4"
                } py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="font-medium">{item.label}</span>}
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
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg ${
            collapsed ? "px-2" : ""
          }`}
        >
          <CiLogout className="w-6 h-6" />{" "}
          {!collapsed && <span className="font-medium text-lg">Log out</span>}
        </button>
      </div>
    </div>
  );
}
