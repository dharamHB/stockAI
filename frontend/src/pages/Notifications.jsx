import React, { useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../config";
import { useTheme } from "../context/ThemeContext";
import { Bell, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Notifications = () => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { "x-auth-token": localStorage.getItem("token") },
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/api/notifications/${id}/read`,
        {},
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      fetchNotifications(); // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary-600 mb-1" />
            NOTIFICATIONS
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 ml-11">
            System Alerts & Requests
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {notifications.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
              <p className="text-gray-400 font-bold uppercase tracking-widest">
                No notifications found
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <Link
                to={`/notifications/${notif.id}`}
                key={notif.id}
                className={`group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block ${
                  notif.is_read
                    ? "border-gray-100 dark:border-gray-700 opacity-70 hover:opacity-100"
                    : "border-primary-500/30 dark:border-primary-500/30 shadow-primary-500/5 ring-1 ring-primary-500/20"
                }`}
              >
                <div className="flex justify-between items-start items-center">
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 p-3 rounded-xl ${
                        notif.is_read
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-400"
                          : "bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                      }`}
                    >
                      {notif.type === "TENANT_REGISTERED" ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Bell className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3
                        className={`font-bold text-lg mb-1 group-hover:text-primary-600 transition-colors ${
                          notif.is_read
                            ? "text-gray-600 dark:text-gray-300"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {notif.type.replace("_", " ")}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                        {notif.message}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!notif.is_read && (
                      <button
                        onClick={(e) => markAsRead(notif.id, e)}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider px-3 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
