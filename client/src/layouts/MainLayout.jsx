import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { Outlet } from "react-router-dom";
import "./MainLayout.css";

export default function MainLayout() {
  return (
    <div className="layout">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT CONTENT */}
      <div className="layout-main">
        <Header />

        <div className="layout-content">
          <Outlet />   {/* 👈 THIS IS THE KEY */}
        </div>
      </div>
    </div>
  );
}
