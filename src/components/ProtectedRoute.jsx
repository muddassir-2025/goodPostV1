import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const authStatus = useSelector((state) => state.auth.status);
  const location = useLocation();

  if (!authStatus) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

