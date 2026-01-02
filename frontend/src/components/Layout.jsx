import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import clsx from "clsx";
import { Menu, Sun, Moon, Bell } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import API_URL from "../config";

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");

  const fetchUnreadCount = async () => {
    if (userRole !== "super_admin" && userRole !== "admin") return;
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { "x-auth-token": localStorage.getItem("token") },
      });
      const unread = response.data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black relative">
      {/* Mobile Backdrop */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
      />

      <div
        className={clsx(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isCollapsed ? "ml-20" : isMobile ? "ml-20" : "ml-64"
        )}
      >
        <header className="h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 flex items-center px-8 sticky top-0 z-30 justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all active:scale-95 shadow-sm border border-gray-100 dark:border-neutral-800"
                title={
                  theme === "dark" ? "Switch to Solaris" : "Switch to Lunar"
                }
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-primary-600" />
                )}
              </button>
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 italic hidden lg:block">
              Operational Interface / System Core
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {(userRole === "super_admin" || userRole === "admin") && (
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all active:scale-95 shadow-sm border border-gray-100 dark:border-neutral-800"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 dark:bg-neutral-900 rounded-full border border-gray-100 dark:border-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                System Active
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
