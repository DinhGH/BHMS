import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loading from "./loading.jsx";

// Optional role-based guard. Pass roles={["ADMIN"]} or roles={["OWNER","ADMIN"]}.
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading isLoading={true} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0) {
    const currentRole = user?.role?.toUpperCase?.();
    const allowed = roles.some((r) => r.toUpperCase() === currentRole);
    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
