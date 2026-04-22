import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import LogoutBtn from "./LogoutBtn";

export default function Navbar() {
  const user = useSelector((state) => state.auth.userData);

  return (
    <nav className="w-full px-6 py-3 flex items-center justify-between 
      bg-slate-50 dark:bg-slate-900 
      text-slate-700 dark:text-slate-200 
      shadow-sm border-b border-slate-200 dark:border-slate-800"
    >
      {/* Left - Brand / Home */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="px-3 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          Home
        </Link>

        <Link
          to="/favorites"
          className="px-3 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          Favorites
        </Link>


      </div>

      {/* Right - Links */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              to="/create"
              className="px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 
              dark:bg-indigo-500/20 dark:text-indigo-300 
              hover:scale-[1.03] transition"
            >
              Create Post
            </Link>

            <LogoutBtn />
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-3 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="px-3 py-1 rounded-md bg-indigo-500 text-white 
              hover:bg-indigo-600 transition"
            >
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}