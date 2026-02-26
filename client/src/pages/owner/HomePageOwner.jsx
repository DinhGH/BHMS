import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Dashboard from "../../components/Dashboard";
import BoardingHouseManagement from "../../components/BoardingHouseManagement";
import ContractManagement from "../../components/ContractManagement";
import TenantsManagement from "../../components/TenantsManagement";
import ReportManagement from "../../components/ReportManagement";
import ReportIssue from "../../components/ReportIssue";
import Loading from "../../components/loading.jsx";
import PaymentManagement from "../../components/PaymentManagement";
import ServiceManagement from "../../components/ServiceManagement";
import OwnerProfileModal from "../../components/OwnerProfileModal";
import { useAuth } from "../../contexts/AuthContext";
import { getNotifications, markNotificationsRead } from "../../services/api";
import api from "../../services/api";

function HomePageOwner() {
  const { user, loading, logout, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

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
      } catch {
        if (!cancelled) {
          setShowProfileModal(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [updateUser, user?.email, user?.fullName, user?.id, user?.imageUrl]);

  // Fetch notifications when user is ready (filtering is client-side)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const data = await getNotifications();
        if (!cancelled) {
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [user?.id]);

  // Client-side filter by searchQuery (title/content)
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
      case "contracts":
        return <ContractManagement />;
      case "tenants":
        return <TenantsManagement />;
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

  const toggleNotifications = async () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);

    if (!nextOpen) return;

    try {
      await markNotificationsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleProfileUpdate = (updatedData) => {
    if (!updatedData) return;
    updateUser(updatedData);
  };

  return (
    <div className="flex flex-col h-dvh bg-slate-50 overflow-hidden">
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
        notificationCount={unreadCount}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          onLogout={logout}
        />
        <main
          className={`flex-1 min-w-0 overflow-y-auto bg-slate-50 ${
            activeSection === "reports" || activeSection === "report-issue"
              ? "p-0"
              : "p-3 sm:p-4 lg:p-6"
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
        className={`fixed right-0 w-full sm:w-96 app-surface border-y-0 border-r-0 z-50 transform transition-transform duration-300 ease-in-out ${
          showNotifications ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          height: "calc(100dvh - 3.5rem)",
          top: "3.5rem",
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
              className="app-input"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {notificationsLoading ? (
              <div className="text-center text-sm text-slate-500 py-4">
                Loading notifications...
              </div>
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
                No notifications available
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
