import { useState } from "react";
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
  FaBars,
  FaTimes,
} from "react-icons/fa";

function Sidebar({ activeSection, setActiveSection }) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      id: "boarding-house",
      label: "Boarding House",
      icon: <FaBuilding />,
    },
    {
      id: "rooms",
      label: "Room Management",
      icon: <FaDoorOpen />,
    },
    {
      id: "tenants",
      label: "Tenants",
      icon: <FaUsers />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <FaBell />,
    },
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
    {
      id: "payments",
      label: "Payments",
      icon: <FaCreditCard />,
    },
  ];

  const handleMenuClick = (id) => {
    setActiveSection(id);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      <button
        className={`fixed top-4 left-4 z-50 md:hidden bg-gray-300 text-black p-2 rounded-lg hover:bg-gray-400 transition-colors ${
          isOpen ? "hidden" : "block"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBars className="text-xl" />
      </button>

      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-40 h-full bg-white border-r border-gray-300 transition-all duration-300 ${
          isOpen ? "w-64" : "w-0 md:w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-300">
            <div className="flex items-center gap-3">
              <FaBuilding className="text-2xl text-black flex-shrink-0" />
              {isOpen && (
                <span className="text-xl font-bold text-black tracking-wider">
                  BHMS
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === item.id
                    ? "bg-gray-200 text-black shadow-lg border-l-4 border-black"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
                onClick={() => handleMenuClick(item.id)}
                title={!isOpen ? item.label : ""}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {isOpen && (
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-300">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-200 hover:text-red-800 transition-all duration-200"
              onClick={handleLogout}
              title={!isOpen ? "Logout" : ""}
            >
              <FaSignOutAlt className="text-lg flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">Log Out</span>}
            </button>
          </div>

          {isOpen && (
            <button
              className="absolute top-4 right-4 md:hidden text-gray-600 hover:text-black"
              onClick={() => setIsOpen(false)}
            >
              <FaTimes className="text-xl" />
            </button>
          )}
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}

export default Sidebar;
