import {
  FaBuilding,
  FaDoorOpen,
  FaUsers,
  FaBell,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaCreditCard,
  FaTachometerAlt,
  FaSignOutAlt,
  FaTimes,
  FaWrench,
} from "react-icons/fa";

function Sidebar({
  activeSection,
  setActiveSection,
  isOpen,
  setIsOpen,
  onLogout,
}) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "boarding-house", label: "Boarding House", icon: <FaBuilding /> },
    { id: "rooms", label: "Room Management", icon: <FaDoorOpen /> },
    { id: "services", label: "Services", icon: <FaWrench /> },
    { id: "tenants", label: "Tenants", icon: <FaUsers /> },
    { id: "notifications", label: "Notifications", icon: <FaBell /> },
    {
      id: "reports",
      label: "Report Management",
      icon: <FaExclamationTriangle />,
    },
    {
      id: "report-issue",
      label: "Report Issue",
      icon: <FaExclamationCircle />,
    },
    { id: "payments", label: "Payments", icon: <FaCreditCard /> },
  ];

  const handleMenuClick = (id) => {
    setActiveSection(id);
    setIsOpen(false); // mobile: đóng sidebar sau khi chọn
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative z-40
        top-16 lg:top-0 h-[calc(100vh-4rem)] lg:h-full w-64 bg-white border-r border-gray-300
        transition-transform duration-300 flex flex-col left-0`}
      >
        {/* Header / Logo */}
        <div className="p-4 sm:p-5 md:p-6 border-b border-gray-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FaBuilding className="text-xl sm:text-2xl text-black shrink-0" />
            <span className="text-lg sm:text-xl font-bold text-black tracking-wider">
              BHMS
            </span>
          </div>

          <button
            className="lg:hidden text-gray-600 hover:text-black"
            onClick={() => setIsOpen(false)}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto min-h-0">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg
              transition-all duration-200 text-left ${
                activeSection === item.id
                  ? "bg-gray-200 text-black shadow-md border-l-4 border-black"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <span className="text-base sm:text-lg shrink-0">{item.icon}</span>
              <span className="text-xs sm:text-sm font-medium truncate">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Logout - Always visible at bottom */}
        <div className="p-2 sm:p-3 border-t border-gray-300 shrink-0">
          <button
            onClick={() => {
              if (onLogout) onLogout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3
            rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-800
            transition-all duration-200"
          >
            <FaSignOutAlt className="text-base sm:text-lg shrink-0" />
            <span className="text-xs sm:text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar;
