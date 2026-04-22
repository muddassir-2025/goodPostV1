import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../features/auth/authSlice";
import authService from "../appwrite/auth";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (authStatus) navigate("/");
  }, [authStatus, navigate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const userData = await authService.signup({ email, password, name });

      if (userData) {
        await authService.login({ email, password });

        const user = await authService.getCurrentUser();
        if (user) {
          dispatch(login(user));
        }
      }
    } catch (error) {
      console.log("signup failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white dark:bg-slate-900 
        border border-slate-200 dark:border-slate-800 
        rounded-xl shadow-sm p-6 space-y-4"
      >
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Signup
        </h2>

        {/* Name */}
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-md 
          bg-slate-50 dark:bg-slate-800 
          border border-slate-200 dark:border-slate-700 
          text-slate-800 dark:text-slate-100 
          focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Email */}
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-md 
          bg-slate-50 dark:bg-slate-800 
          border border-slate-200 dark:border-slate-700 
          text-slate-800 dark:text-slate-100 
          focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-md 
          bg-slate-50 dark:bg-slate-800 
          border border-slate-200 dark:border-slate-700 
          text-slate-800 dark:text-slate-100 
          focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Button */}
        <button
          type="submit"
          className="w-full py-2 rounded-md 
          bg-indigo-500 text-white 
          hover:bg-indigo-600 
          active:scale-[0.98] transition"
        >
          Signup
        </button>
      </form>
    </div>
  );
}