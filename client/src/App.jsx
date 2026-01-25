/* eslint-disable no-unused-vars */
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout.jsx";
import HomePageOwner from "./pages/owner/HomePageOwner";
import LandingPage from "./pages/LandingPage";
import "./styles/App.css";

function App() {
  const [resetEmail, setResetEmail] = useState("");

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={<AdminLayout />}></Route>
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
          <Route path="/owner" element={<HomePageOwner />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
