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

export default function AdminSidebar({ user, onLogout }) {
  const navigate = useNavigate();
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

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div>
            <div className="font-bold text-gray-800">
              {user?.name || "Nguyen Van A"}
            </div>
            <div className="text-xs text-gray-500">
              {user?.role === "ADMIN" ? "Administrator" : ""}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mb-4">
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
        <div className="flex ">
          <div className="w-full">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu..."
            />
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        {filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
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
          onClick={() => {
            if (onLogout) onLogout();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
        >
          <CiLogout className="w-6 h-6" />{" "}
          <span className="font-medium text-lg">Log out</span>
        </button>
      </div>
    </div>
  );
}
