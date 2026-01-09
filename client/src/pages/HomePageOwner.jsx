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

  return (
    <div className="flex flex-col h-screen bg-white">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default HomePageOwner;
