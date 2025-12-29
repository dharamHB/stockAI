import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const Login = () => {
  const { showLoader, hideLoader } = useLoading();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.name);
        navigate("/");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 text-center">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Enter your credentials to access the admin panel.
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium text-gray-300 mb-1"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 placeholder-gray-500"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-300 mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 placeholder-gray-500"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] duration-200"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Forgot your credentials?{" "}
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer">
                Contact Support
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
