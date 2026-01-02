import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Briefcase, UserPlus, Eye, EyeOff } from "lucide-react";

const RegisterTenant = () => {
  const { showLoader, hideLoader } = useLoading();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_number: "",
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    showLoader();
    setError("");

    // Basic Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.contact_number ||
      !formData.username ||
      !formData.password
    ) {
      setError("All fields are required.");
      hideLoader();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register-tenant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          data.message || "Registration successful! Please wait for approval.",
          {
            duration: 5000,
            icon: "🚀",
          }
        );
        setTimeout(() => navigate("/login"), 3000); // Redirect to login after 3s
      } else {
        setError(data.error || "Registration failed");
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
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 dark:bg-primary-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 left-8 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-xl hover:scale-110 active:scale-95 transition-all text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-primary-600" />
        )}
      </button>

      <div className="max-w-xl w-full relative group my-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-primary-400 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-neutral-800 rounded-[2rem] shadow-2xl p-10 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-100 dark:border-purple-900/20 shadow-inner group-hover:rotate-6 transition-transform duration-500">
              <Briefcase className="w-8 h-8 text-purple-600 dark:text-purple-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic tracking-tighter mb-2">
              Tenant Registration
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500 italic">
              Join the Ecosystem
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black italic uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
                  Business / Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold placeholder-gray-400 dark:placeholder-neutral-700"
                  placeholder="John Doe Enterprises"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black italic uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold placeholder-gray-400 dark:placeholder-neutral-700"
                  placeholder="contact@business.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black italic uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contact_number"
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold placeholder-gray-400 dark:placeholder-neutral-700"
                  placeholder="+1 234 567 890"
                  value={formData.contact_number}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black italic uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold placeholder-gray-400 dark:placeholder-neutral-700"
                  placeholder="johndoe_ent"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black italic uppercase tracking-widest text-gray-500 dark:text-gray-400 px-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold placeholder-gray-400 dark:placeholder-neutral-700 pr-12"
                    placeholder="********"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest italic animate-in fade-in slide-in-from-top-1">
                <span className="text-sm">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98] flex items-center justify-center gap-3 group/btn mt-6"
            >
              Request Access
              <UserPlus className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </button>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="text-[10px] font-bold text-gray-400 hover:text-purple-500 uppercase tracking-widest transition-colors"
              >
                Already have an account? Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterTenant;
