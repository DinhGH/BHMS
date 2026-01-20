import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { loginUser } from "../shared/utils/authService";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("error") || "");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginUser(formData.email, formData.password);

      if (!result.success) {
        setError(result.message || "Login failed");
        return;
      }

      // Update AuthContext
      login(result.data, result.token);

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      // Redirect based on role
      const role = result?.data?.role?.toUpperCase?.();
      const redirectPath =
        role === "ADMIN"
          ? "/admin"
          : role === "OWNER"
            ? "/owner"
            : "/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError("Connection error. Please check the server.");
      console.error("Login error:", err);
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

        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-black">Log in</h2>
        </div>

        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email address or user name
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showPassword ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  ) : (
                    <>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </>
                  )}
                </svg>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div className="text-xs text-gray-600 mb-4 text-center">
            By continuing, you agree to the{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of use
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 bg-linear-to-r from-gray-700 to-black text-white rounded-lg font-semibold hover:from-gray-800 hover:to-gray-900 transform hover:-translate-y-0.5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={!formData.email || !formData.password || loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          <div className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-sm text-gray-600 hover:underline"
            >
              Forgot your password
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-gray-700 hover:underline font-semibold"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
