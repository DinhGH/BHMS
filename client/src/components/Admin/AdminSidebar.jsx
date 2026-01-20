import React, { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import SearchInput from "./SearchInput.jsx";
import { CiLogout } from "react-icons/ci";
import {
  FaTachometerAlt,
  FaUsers,
  FaBell,
  FaExclamationCircle,
} from "react-icons/fa";
import { AiFillSetting } from "react-icons/ai";

export default function AdminSidebar({ user }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(2);
  const [search, setSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // xu ly logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSettings = () => {
    navigate("/admin/settings");
  };
  const handleNotifications = () => {
    alert("You have " + notifications + " notifications!");
    setNotifications(0);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-400/30"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 right-0 lg:left-0 lg:right-auto z-40
        w-[85%] max-w-xs sm:max-w-sm lg:w-72 bg-linear-to-b from-white via-slate-50 to-slate-100
        border-l border-slate-200 shadow-2xl flex flex-col lg:rounded-r-3xl
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/70 bg-white/90 backdrop-blur">
          <Link
            to="/"
            className="flex items-center gap-3 mb-5 group"
            aria-label="Back to landing"
          >
            <img
              src="/images/icon.png"
              alt="BHMS Logo"
              className="h-10 w-10 rounded-md transition-transform group-hover:scale-105"
            />
            <div className="leading-tight">
              <p className="text-base font-bold text-blue-600">BHMS</p>
              <p className="text-xs text-slate-500">
                Boarding House Management
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-800 truncate">Admin</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-4">
            <button
              className="p-2 bg-white text-gray-700 rounded-full border border-slate-200 shadow-sm hover:border-blue-200 hover:text-blue-600 hover:shadow-md transition"
              onClick={handleSettings}
              aria-label="Settings"
            >
              <AiFillSetting className="h-5 w-5" />
            </button>
            <button
              className="p-2 bg-white text-gray-700 rounded-full border border-slate-200 shadow-sm hover:border-blue-200 hover:text-blue-600 hover:shadow-md transition relative"
              onClick={handleNotifications}
              aria-label="Notifications"
            >
              <FaBell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {notifications}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="w-full">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl mb-3 border transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-200 shadow-lg shadow-blue-100"
                    : "text-slate-700 bg-white border-slate-200 hover:border-blue-200 hover:text-blue-700 hover:shadow-md"
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border border-rose-200/70"
          >
            <CiLogout className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </div>
    </>
  );
}
