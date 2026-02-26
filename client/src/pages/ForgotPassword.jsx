import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Loading from "../components/loading.jsx";
import { forgotPassword } from "../shared/utils/authService";

export default function ForgotPassword({ onOtpSent }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setEmail(v);
    if (error) {
      if (validateEmail(v)) setError("");
      else setError("Please enter a valid email address");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await forgotPassword(email);

      if (!result.success) {
        setError(result.message || "Failed to send OTP");
        return;
      }

      // Store email in sessionStorage for next step
      sessionStorage.setItem("resetEmail", email);

      if (typeof onOtpSent === "function") {
        onOtpSent(email);
      }

      // Navigate to reset password page
      navigate("/reset-password");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Loading isLoading={loading} />
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
              <p className="text-xs text-slate-600">
                Boarding House Management
              </p>
            </div>
          </Link>

          <h1 className="text-3xl font-bold text-black text-center mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your email to receive an OTP code
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Registered Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleChange}
                disabled={loading}
                required
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "email-error" : undefined}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition disabled:bg-gray-100 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error && (
                <div id="email-error" className="text-red-600 text-xs mt-2">
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-linear-to-r from-gray-700 to-black text-white rounded-lg font-semibold hover:from-gray-800 hover:to-gray-900 transform hover:-translate-y-0.5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP Code"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            We system will send a confirmation code to your email
          </p>
        </div>
      </div>
    </>
  );
}
