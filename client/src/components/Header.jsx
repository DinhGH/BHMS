import { HiBell, HiUser } from "react-icons/hi";

export default function Header({
  userName = "User Name",
  unreadCount = 3,
  onBellClick,
  onAvatarClick,
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-300">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="h-12 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 text-slate-900">
            <img src="./icon.png" alt="BHMS Logo" className="w-6 h-6" />
            <span className="font-bold tracking-wide">
              Boarding House Management System
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Welcome */}
            <span className="hidden md:inline text-sm text-slate-600">
              Welcome, {userName}!
            </span>

            {/* Bell */}
            <button
              onClick={onBellClick}
              className="relative text-slate-600 hover:text-slate-900"
            >
              <HiBell className="h-7 w-7" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Avatar triggers profile panel */}
            <button
              onClick={onAvatarClick}
              className="h-7 w-7 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition"
              title="Profile"
            ></button>
          </div>
        </div>
      </div>
    </header>
  );
}
