import { useState } from "react";
import { MdHomeRepairService } from "react-icons/md";
import {
  FaReceipt,
  FaHistory,
  FaExclamationCircle,
  FaUser,
  FaBell,
} from "react-icons/fa";
import Header from "../../components/Header";
import NotificationsPanel from "../../components/NotificationsPanel";
import ProfilePanel from "../../components/ProfilePanel";
import { useAuth } from "../../hooks/useAuth";

export default function TenantHome() {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

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

  const handleLogout = () => {
    console.log("User logged out");
    logout();
    // TODO: Redirect to login page
  };

  const handleViewProfile = () => {
    console.log("View profile clicked");
    toggleProfile();
  };

  const handleSettings = () => {
    console.log("Settings clicked");
    // TODO: Navigate to settings page
  };

  const handleViewRoomDetail = () => {
    console.log("View room detail clicked");
    // TODO: Navigate to room detail page
  };

  const handleViewInvoice = () => {
    console.log("View invoice clicked");
    // TODO: Navigate to invoice page
  };

  const handlePaymentHistory = () => {
    console.log("Payment history clicked");
    // TODO: Navigate to payment history page
  };

  const handleReportIssue = () => {
    console.log("Report issue clicked");
    // TODO: Open report issue modal or navigate to page
  };

  return (
    <div className="min-h-screen bg-white border-l border-slate-300">
      <Header
        userName={user.name}
        unreadCount={3}
        onBellClick={toggleNotifications}
        onAvatarClick={toggleProfile}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Room A - Block A
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Manage your room and billing information
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {/* View Room Detail */}
          <div
            onClick={handleViewRoomDetail}
            className="rounded-lg bg-white border border-slate-200 p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-slate-400 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black flex items-center justify-center text-white mb-3 sm:mb-4">
              <MdHomeRepairService size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
              View Room Detail
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Check room information, utilities, and meter readings
            </p>
          </div>

          {/* View Invoice */}
          <div
            onClick={handleViewInvoice}
            className="rounded-lg bg-white border border-slate-200 p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-slate-400 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white mb-3 sm:mb-4">
              <FaReceipt size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
              View Invoice
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              See this month's invoice and payment details
            </p>
          </div>

          {/* Payment History */}
          <div
            onClick={handlePaymentHistory}
            className="rounded-lg bg-white border border-slate-200 p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-slate-400 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-700 flex items-center justify-center text-white mb-3 sm:mb-4">
              <FaHistory size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
              Payment History
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Review your past payments and transaction records
            </p>
          </div>

          {/* Report Issue */}
          <div
            onClick={handleReportIssue}
            className="rounded-lg bg-white border border-slate-200 p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-slate-400 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black flex items-center justify-center text-white mb-3 sm:mb-4">
              <FaExclamationCircle size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
              Report Issue
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Report maintenance issues or problems in your room
            </p>
          </div>

          {/* Profile */}
          <div
            onClick={handleViewProfile}
            className="rounded-lg bg-white border border-slate-200 p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-slate-400 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-900 flex items-center justify-center text-white mb-3 sm:mb-4">
              <FaUser size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
              Profile
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              View and update your personal information and settings
            </p>
          </div>

          {/* View Notifications */}
          <div
            className="rounded-lg bg-white border border-slate-200 p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-slate-400 transition-all duration-200 cursor-pointer"
            onClick={toggleNotifications}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-800 flex items-center justify-center text-white mb-3 sm:mb-4">
              <FaBell size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
              View Notifications
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Check your latest notifications and updates
            </p>
          </div>
        </div>
      </div>

      {/* Transparent overlay to close panels when clicking outside */}
      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 top-12 bg-transparent z-30"
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}

      {/* Sliding Profile Panel (right) */}
      <div
        className={`fixed top-12 right-0 bottom-0 w-screen sm:w-80 md:w-88 bg-white border-l border-t border-slate-300 z-40 transform transition-transform duration-300 ease-in-out ${
          showProfile ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <ProfilePanel
          user={user}
          onLogout={handleLogout}
          onViewProfile={handleViewProfile}
          onSettings={handleSettings}
        />
      </div>

      {/* Sliding Notifications Panel (right) */}
      <div
        className={`fixed top-12 right-0 bottom-0 w-screen sm:w-80 md:w-96 bg-white border-l border-t border-slate-300 z-40 transform transition-transform duration-300 ease-in-out ${
          showNotifications ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <NotificationsPanel userId={user.id} />
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">BHMS</h3>
              <p className="text-slate-600">Boarding House Management System</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Support</h3>
              <ul className="space-y-1 text-slate-600">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Legal</h3>
              <ul className="space-y-1 text-slate-600">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
            © 2026 BHMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
