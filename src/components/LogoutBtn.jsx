import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import authService from "../appwrite/auth";

export default function LogoutBtn() {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
  };

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1 rounded-md 
      bg-rose-100 text-rose-600 
      dark:bg-rose-500/20 dark:text-rose-300 
      hover:bg-rose-200 dark:hover:bg-rose-500/30 
      active:scale-95 transition"
    >
      Logout
    </button>
  );
}