/* eslint-disable no-unused-vars */
import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout.jsx";
import PaymentMethodModal from "./components/PaymentMethodModal";

import HomePageOwner from "./pages/owner/HomePageOwner";
import LandingPage from "./pages/LandingPage";
import "./styles/App.css";
import ServiceManagement from "./components/ServiceManagement";
import ReportManagement from "./components/ReportManagement";
import AdminUser from "./pages/Admin/AdminUser.jsx";
import ReportAdmin from "./pages/Admin/ReportAdmin.jsx";

import AdminDashBoard from "./components/Admin/AdminDashBoard.jsx";

function App() {
  const [resetEmail, setResetEmail] = useState("");

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashBoard />} />
          <Route path="users" element={<AdminUser />} />
          <Route path="report" element={<ReportAdmin />} />
        </Route>
        <Route
          path="/forgot-password"
          element={
            <ForgotPassword onOtpSent={(email) => setResetEmail(email)} />
          }
        />
        <Route
          path="/reset-password"
          element={
            <ResetPassword
              onBackToLogin={() => (window.location.href = "/login")}
              onResetComplete={() => (window.location.href = "/login")}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <h1>Dashboard - Coming Soon</h1>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<LandingPage />} />
        <Route path="/payment/:id" element={<PaymentMethodModal />} />
        <Route
          path="/owner"
          element={
            <ProtectedRoute roles={["OWNER"]}>
              <HomePageOwner />
            </ProtectedRoute>
          }
        />

        <Route path="/services" element={<ServiceManagement />} />
        <Route path="/reports" element={<ReportManagement />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
