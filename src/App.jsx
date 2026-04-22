import { useEffect,useState } from "react";
import { useDispatch } from "react-redux";
import { login, logout } from "./features/auth/authSlice";

import authService from "./appwrite/auth";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreatePost from "./pages/Createpost";
import EditPost from "./pages/EditPost";
import Home from "./pages/Home";
import SinglePost from "./pages/SinglePost";
import Favorites from "./pages/Favorite";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

function App() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user) dispatch(login(user));
      else dispatch(logout());
      setLoading(false); // ✅ important
    });
  }, []);

   // ✅ ADD THIS HERE (before return)
  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites/>} />
       <Route path="/post/:slug" element={<SinglePost />} />
        
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />

         <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <EditPost />
            </ProtectedRoute>
          }
        />




      </Routes>
    </BrowserRouter>
  );
}

export default App;