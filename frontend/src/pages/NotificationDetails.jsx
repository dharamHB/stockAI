import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from "../config";
import toast from "react-hot-toast";
import { ArrowLeft, Check, X, User, Mail, Calendar, Info } from "lucide-react";

const NotificationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchNotification();
  }, [id]);

  const fetchNotification = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/${id}`, {
        headers: { "x-auth-token": localStorage.getItem("token") },
      });
      setNotification(response.data);
      // Mark as read when viewing
      if (!response.data.is_read) {
        await axios.put(
          `${API_URL}/api/notifications/${id}/read`,
          {},
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
      }
    } catch (error) {
      console.error("Error fetching notification:", error);
      toast.error("Failed to load details");
      navigate("/notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!notification || !notification.data || !notification.data.userId) {
      toast.error("Invalid notification data");
      return;
    }
    setProcessing(true);
    try {
      await axios.post(
        `${API_URL}/api/admin/approve-tenant`,
        { userId: notification.data.userId, action },
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      toast.success(`Tenant ${action}ed successfully`);
      navigate("/notifications");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || `Failed to ${action} tenant`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!notification) return null;

  const { type, message, data, created_at } = notification;
  // data is automatically parsed by node-postgres if column is JSONB.
  // If it's string, we might need JSON.parse, but mostly it is object.
  // Assuming it comes as object.

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/notifications")}
        className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Notifications
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">
            {type.replace("_", " ")}
          </h1>
          <p className="text-gray-500 font-medium">{message}</p>
          <p className="text-xs text-gray-400 mt-4 font-mono">
            {new Date(created_at).toLocaleString()}
          </p>
        </div>

        <div className="p-8">
          {type === "TENANT_REGISTERED" && data && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-widest text-primary-600 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" /> Applicant Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      Name
                    </p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {data.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      Email
                    </p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {data.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      Unique ID
                    </p>
                    <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                      {data.userId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                <button
                  onClick={() => handleAction("approve")}
                  disabled={processing}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    "Processing..."
                  ) : (
                    <>
                      {" "}
                      <Check className="w-4 h-4" /> Approve Tenant{" "}
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleAction("reject")}
                  disabled={processing}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-300 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" /> Reject Request
                </button>
              </div>
            </div>
          )}

          {type !== "TENANT_REGISTERED" && (
            <div className="text-gray-500 italic">
              No additional actions available for this notification type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDetails;
