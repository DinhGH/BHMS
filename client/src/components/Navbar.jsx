/* eslint-disable no-unused-vars */
import { FaUserCircle, FaBell, FaBars } from "react-icons/fa";

function Navbar({ onMenuClick, onBellClick, onAvatarClick, sidebarOpen }) {
  const user = {
    name: "Nguyễn Văn A",
    avatar: null,
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-300">
      <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-gray-700 hover:text-black transition-colors p-1"
              onClick={onMenuClick}
            >
              <FaBars className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-black truncate">
              <span className="hidden sm:inline">
                Boarding House Management System
              </span>
              <span className="sm:hidden">BHMS</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <button
              className="relative text-gray-600 hover:text-black transition-colors"
              onClick={onBellClick}
            >
              <FaBell className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-semibold">
                3
              </span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="flex items-center gap-2 focus:outline-none"
                onClick={onAvatarClick}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border-2 border-gray-400"
                  />
                ) : (
                  <FaUserCircle className="text-3xl sm:text-3xl md:text-4xl text-gray-600" />
                )}
              </button>
              <div className="hidden md:block text-right">
                <p className="text-xs md:text-sm font-semibold text-black">
                  {user.name}
                </p>
                <p className="text-xs text-gray-600">Owner</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
