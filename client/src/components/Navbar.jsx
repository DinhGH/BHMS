import { FaUserCircle, FaBell, FaBars, FaTimes } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar({ onMenuClick, onBellClick, onAvatarClick, user }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayName = user?.fullName || user?.name || "User";
  const displayRole = user?.role
    ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
    : "";

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (onAvatarClick) onAvatarClick();
  };

  return (
    <header className="sticky top-0 z-50 bg-linear-to-r from-white via-slate-50 to-white/95 border-b border-slate-200/50 backdrop-blur-md shadow-lg">
      <div className="px-3 sm:px-4 md:px-6 py-2 md:py-3">
        <div className="flex items-center justify-between">
          {/* Left Section: Menu Button & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-slate-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
              onClick={onMenuClick}
              aria-label="Toggle sidebar"
            >
              <FaBars className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Logo + Brand */}

            <img
              src="https://res.cloudinary.com/dfez8v1fj/image/upload/v1769906103/icon_xwr5av.png"
              alt="BHMS Logo"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-md transition-transform group-hover:scale-105"
            />
            <div className="leading-tight truncate">
              <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate">
                <span className="hidden sm:inline">
                  Boarding House Management
                </span>
                <span className="sm:hidden">BHMS</span>
              </p>
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Notification Bell */}
            <button
              className="relative text-slate-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
              onClick={onBellClick}
              aria-label="Notifications"
            >
              <FaBell className="h-5 w-5 sm:h-6 sm:w-6 md:h-6 md:w-6" />
              <span className="absolute top-1 sm:top-1.5 -right-0.5 bg-linear-to-r from-red-600 to-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold shadow-md">
                3
              </span>
            </button>

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-slate-300" />

            {/* User Profile */}
            <div className="flex items-center gap-2 sm:gap-2 md:gap-3 relative">
              <button
                className="flex items-center gap-2 focus:outline-none p-1 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={handleAvatarClick}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-blue-400 object-cover"
                  />
                ) : (
                  <FaUserCircle className="text-2xl sm:text-3xl md:text-4xl text-slate-400" />
                )}
              </button>

              {/* User Info */}
              <div className="hidden md:block text-right min-w-0">
                <p className="text-xs md:text-sm font-semibold text-slate-900 truncate">
                  {displayName}
                </p>
                {displayRole && (
                  <p className="text-xs text-slate-500">{displayRole}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
