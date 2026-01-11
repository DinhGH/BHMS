import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import BoardingHouseManagement from "../components/BoardingHouseManagement";
import RoomManagement from "../components/RoomManagement";
import TenantsManagement from "../components/TenantsManagement";
import NotificationManagement from "../components/NotificationManagement";
import ReportManagement from "../components/ReportManagement";
import ReportIssue from "../components/ReportIssue";
import PaymentManagement from "../components/PaymentManagement";

function HomePageOwner() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "boarding-house":
        return <BoardingHouseManagement />;
      case "rooms":
        return <RoomManagement />;
      case "tenants":
        return <TenantsManagement />;
      case "notifications":
        return <NotificationManagement />;
      case "reports":
        return <ReportManagement />;
      case "report-issue":
        return <ReportIssue />;
      case "payments":
        return <PaymentManagement />;
      default:
        return <Dashboard />;
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) setShowProfile(false);
      return next;
    });
  };

  const toggleProfile = () => {
    setShowProfile((prev) => {
      const next = !prev;
      if (next) setShowNotifications(false);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Navbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onBellClick={toggleNotifications}
        onAvatarClick={toggleProfile}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4 md:p-6">
          {renderContent()}
        </main>
      </div>

      {/* Overlay to close panels */}
      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}

      {/* Notifications Panel */}
      <div
        className={`fixed top-14 right-0 bottom-0 w-full sm:w-96 bg-white border-l border-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${
          showNotifications ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-12 flex items-center px-4 border-b border-slate-200 font-semibold text-sm sm:text-base text-slate-900">
            Notifications
          </div>
          <div className="p-4 border-b border-slate-200">
            <input
              type="text"
              placeholder="Search notifications..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {[1, 2, 3].map((id) => (
              <div
                key={id}
                className="rounded-md border border-slate-200 p-3 bg-white shadow-sm"
              >
                <div className="text-[11px] text-slate-500 mb-1">2h ago</div>
                <div className="text-sm font-semibold text-slate-900">
                  Notification title {id}
                </div>
                <div className="text-sm text-slate-700 line-clamp-2">
                  This is a sample notification detail for preview purposes.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Panel */}
      <div
        className={`fixed top-14 right-0 bottom-0 w-full sm:w-96 bg-white border-l border-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${
          showProfile ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-12 flex items-center px-4 border-b border-slate-200 font-semibold text-sm sm:text-base text-slate-900">
            Your Profile
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-slate-50">
            <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-1">
              <div className="text-xs text-slate-500">Full Name</div>
              <div className="text-sm font-semibold text-slate-900">
                Nguyễn Văn A
              </div>
              <div className="text-xs text-slate-500">Email</div>
              <div className="text-sm text-slate-800">owner@example.com</div>
              <div className="text-xs text-slate-500">Phone</div>
              <div className="text-sm text-slate-800">+84 912 345 678</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-900 font-semibold py-2 rounded-lg hover:bg-slate-100 transition">
                View Profile
              </button>
              <button className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-900 font-semibold py-2 rounded-lg hover:bg-slate-100 transition">
                Settings
              </button>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-semibold py-2 rounded-lg transition">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePageOwner;
