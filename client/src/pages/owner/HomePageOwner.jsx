import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Dashboard from "../../components/Dashboard";
import BoardingHouseManagement from "../../components/BoardingHouseManagement";
import RoomManagement from "../../components/RoomManagement";
import TenantsManagement from "../../components/TenantsManagement";
import NotificationManagement from "../../components/NotificationManagement";
import ReportManagement from "../../components/ReportManagement";
import ReportIssue from "../../components/ReportIssue";
import Loading from "../../components/loading.jsx";
import PaymentManagement from "../../components/PaymentManagement";
import ServiceManagement from "../../components/ServiceManagement";
import OwnerProfileModal from "../../components/OwnerProfileModal";
import { useAuth } from "../../contexts/AuthContext";
import { getNotifications } from "../../services/api";
import api from "../../services/api";
// import { getNotifications } from "../../services/api";

function HomePageOwner() {
  const { user, loading, logout, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const profile = await api.get("/api/owner/profile");
        if (cancelled || !profile) return;

        const nextFullName = profile.fullName || "";
        const nextImageUrl = profile.imageUrl || "";
        const nextEmail = profile.email || user.email || "";

        if (
          nextFullName !== (user.fullName || "") ||
          nextImageUrl !== (user.imageUrl || "") ||
          nextEmail !== (user.email || "")
        ) {
          updateUser({
            fullName: nextFullName,
            imageUrl: nextImageUrl,
            email: nextEmail,
          });
        }
      } catch (error) {
        console.error("Failed to sync owner profile:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [updateUser, user?.email, user?.fullName, user?.id, user?.imageUrl]);

  // Fetch notifications once when user is ready (lọc tại client theo searchQuery)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      setNotificationsLoading(true);
      try {
        const data = await getNotifications(); // không truyền tham số
        if (!cancelled) {
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Lọc client-side theo searchQuery (title/content)
  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter((n) => {
      const t = (n.title || "").toLowerCase();
      const c = (n.content || "").toLowerCase();
      return t.includes(q) || c.includes(q);
    });
  }, [notifications, searchQuery]);

  if (loading) {
    return <Loading isLoading={true} />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600 font-semibold">
        Không tìm thấy thông tin người dùng
      </div>
    );
  }

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
      case "services":
        return <ServiceManagement />;
      default:
        return <Dashboard />;
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleProfileUpdate = (updatedData) => {
    if (!updatedData) return;
    updateUser(updatedData);
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Navbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onBellClick={toggleNotifications}
        onAvatarClick={() => {
          setShowNotifications(false);
          setShowProfileModal(true);
        }}
        onLogout={logout}
        sidebarOpen={sidebarOpen}
        user={user}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          onLogout={logout}
        />
        <main
          className={`flex-1 overflow-y-auto bg-gray-50 ${
            activeSection === "reports" || activeSection === "report-issue"
              ? "p-0"
              : "p-3 sm:p-4 md:p-6"
          }`}
        >
          {renderContent()}
        </main>
      </div>

      {/* Overlay to close panels */}
      {showNotifications && (
        <div
          className="fixed inset-0 bg-transparent z-40 bottom-0"
          onClick={() => {
            setShowNotifications(false);
          }}
        />
      )}

      {/* Notifications Panel */}
      <div
        className={`fixed right-0 w-full sm:w-80 bg-white border-l border-slate-200 z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
          showNotifications ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          height: "calc(100vh - 65px)",
          top: "65px",
        }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-center px-4 py-3 border-b border-slate-200 font-semibold text-sm sm:text-base text-slate-900">
            Notifications
          </div>
          <div className="p-4 border-b border-slate-200">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {notificationsLoading ? (
              <Loading isLoading={true} />
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-md border p-3 shadow-sm ${
                    notification.isRead
                      ? "border-slate-200 bg-white"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="text-[11px] text-slate-500 mb-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {notification.title}
                  </div>
                  <div className="text-sm text-slate-700 line-clamp-2">
                    {notification.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-slate-500 py-4">
                No notifications found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <OwnerProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}

export default HomePageOwner;
