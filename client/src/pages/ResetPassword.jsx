/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../shared/utils/authService";

export default function ResetPassword({ onBackToLogin, onResetComplete }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(
    sessionStorage.getItem("resetEmail") || "",
  );
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validatePassword = (value) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      value,
    );
  };

  const validate = () => {
    const e = {};
    if (!otp.trim()) e.otp = "OTP code is required";

    if (!password) {
      e.password = "Password is required";
    } else if (!validatePassword(password)) {
      e.password =
        "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character";
    }

    if (confirm !== password) e.confirm = "Passwords don't match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Call reset password API with OTP verification
      const result = await resetPassword(email, otp, password);

      if (!result.success) {
        setErrors({ submit: result.message || "Failed to reset password" });
        return;
      }

      console.log("Password reset successful for", email);
      sessionStorage.removeItem("resetEmail");
      if (typeof onResetComplete === "function") onResetComplete();

      // Navigate back to login
      navigate("/login");
    } catch (err) {
      console.error("Error:", err);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
        {/* Logo & Brand */}
        <Link
          to="/"
          className="flex items-center justify-center gap-3 mb-6 group"
        >
          <img
            src="/images/icon.png"
            alt="BHMS Logo"
            className="h-12 w-12 transition-transform group-hover:scale-110"
          />
          <div className="flex flex-col leading-tight">
            <h1 className="text-xl font-bold text-blue-600">BHMS</h1>
            <p className="text-xs text-slate-600">Boarding House Management</p>
          </div>
        </Link>

        <h1 className="text-3xl font-bold text-black text-center mb-2">
          Reset Password
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Enter the OTP and a new password
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="otp"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              OTP Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition disabled:bg-gray-100 ${
                errors.otp ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.otp && (
              <div className="text-red-600 text-xs mt-2">{errors.otp}</div>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition disabled:bg-gray-100 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.password && (
              <div className="text-red-600 text-xs mt-2">{errors.password}</div>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="confirm"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition disabled:bg-gray-100 ${
                errors.confirm ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.confirm && (
              <div className="text-red-600 text-xs mt-2">{errors.confirm}</div>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-linear-to-r from-gray-700 to-black text-white rounded-lg font-semibold hover:from-gray-800 hover:to-gray-900 transform hover:-translate-y-0.5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            {loading ? "Confirming..." : "Confirm"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            className="text-sm text-gray-600 hover:underline disabled:opacity-50"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
