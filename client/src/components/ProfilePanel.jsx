import { FaSignOutAlt } from "react-icons/fa";

export default function ProfilePanel({
  user,
  onLogout,
  onViewProfile,
  onSettings,
}) {
  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleViewProfile = () => {
    if (onViewProfile) onViewProfile();
  };

  const handleSettings = () => {
    if (onSettings) onSettings();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-12 flex items-center px-4 border-b border-slate-200 font-semibold text-sm sm:text-base text-slate-900">
        Your Profile
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-slate-50">
        <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-1">
          <div className="text-xs text-slate-500">Full Name</div>
          <div className="text-sm font-semibold text-slate-900">
            {user?.name || "User Name"}
          </div>
          <div className="text-xs text-slate-500">Email</div>
          <div className="text-sm text-slate-800">
            {user?.email || "user@example.com"}
          </div>
          <div className="text-xs text-slate-500">Phone</div>
          <div className="text-sm text-slate-800">
            {user?.phone || "+84 912 345 678"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleViewProfile}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-900 font-semibold py-2 rounded-lg hover:bg-slate-100 transition"
          >
            View Profile
          </button>
          <button
            onClick={handleSettings}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-900 font-semibold py-2 rounded-lg hover:bg-slate-100 transition"
          >
            Settings
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-semibold py-2 rounded-lg transition"
        >
          <FaSignOutAlt size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
