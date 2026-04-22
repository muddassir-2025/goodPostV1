import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const authStatus = useSelector((state) => state.auth.status);

  if (!authStatus) {
    return <Navigate to="/login" />;
  }

  return children;
}

