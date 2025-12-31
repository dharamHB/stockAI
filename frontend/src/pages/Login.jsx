import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, TrendingUp, ShieldCheck } from "lucide-react";

const Login = () => {
  const { showLoader, hideLoader } = useLoading();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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
        toast.success(`Welcome back, ${data.user.name}! 👋`, {
          icon: "🎉",
        });
        setTimeout(() => navigate("/"), 500);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black transition-colors duration-500 p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-600/10 dark:bg-primary-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-8 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-xl hover:scale-110 active:scale-95 transition-all text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-primary-600" />
        )}
      </button>

      <div className="max-w-md w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-neutral-800 rounded-[2rem] shadow-2xl p-10 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/10 rounded-2xl flex items-center justify-center mb-6 border border-primary-100 dark:border-primary-900/20 shadow-inner group-hover:rotate-6 transition-transform duration-500">
              <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-500" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 italic tracking-tighter mb-2">
              STOCK AI
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500 italic">
              Quantum Asset Management Core
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black italic uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
                Security Identifier
              </label>
              <div className="relative group/field">
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold placeholder-gray-400 dark:placeholder-neutral-700"
                  placeholder="USERNAME_KEY"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black italic uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
                Access Cipher
              </label>
              <input
                type="password"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold placeholder-gray-400 dark:placeholder-neutral-700"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest italic animate-in fade-in slide-in-from-top-1">
                <span className="text-sm">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98] flex items-center justify-center gap-3 group/btn"
            >
              Initialize Session
              <ShieldCheck className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </form>

          <p className="mt-10 text-center text-gray-500 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest italic leading-relaxed">
            Authorized Personnel Only
            <br />
            <span className="opacity-50">
              E2E Cryptographic Protection Enabled
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
