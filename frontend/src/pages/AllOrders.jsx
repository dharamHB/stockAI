import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";
import toast from "react-hot-toast";

const AllOrders = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");

  useEffect(() => {
    fetchOrders(pagination.currentPage);
  }, [
    pagination.currentPage,
    statusFilter,
    dateFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  const fetchOrders = async (page = 1) => {
    showLoader();
    try {
      let url = `${API_URL}/api/sales/all-orders?page=${page}&limit=${pagination.limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

      if (searchTerm) url += `&search=${searchTerm}`;
      if (statusFilter !== "All") url += `&status=${statusFilter}`;

      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        url += `&startDate=${today.toISOString()}&endDate=${end.toISOString()}`;
      } else if (dateFilter === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        url += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: {
          "x-auth-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setPagination((prev) => ({
          ...prev,
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalCount: data.totalCount,
        }));
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error fetching orders");
    } finally {
      hideLoader();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const handleExport = async (format) => {
    // Reuse export logic but maybe point to admin export if needed.
    // Currently backend supports /api/sales/export/:format (filtered by user_id usually).
    // I might need to implement Admin Export for All Orders, but let's stick to list for now as per "all orders listing".
    // If user wants export, I should probably add /api/sales/all-orders/export.
    // For now, I'll disable export or keep it basic.
    toast("Export feature for All Orders coming soon!", { icon: "🚧" });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/20";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/20";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-800/20";
      default:
        return "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-400 border-gray-200/50 dark:border-neutral-700";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            Global Order Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Monitor and manage all system transactions
          </p>
        </div>
        <div className="flex gap-4">{/* Export Buttons could go here */}</div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-6 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 justify-between">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Order ID, Email, User..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all uppercase tracking-wider"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer uppercase tracking-wider"
            >
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Date Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setDateFilter("all")}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  dateFilter === "all"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                    : "bg-gray-50 dark:bg-neutral-900 text-gray-500 hover:bg-gray-100"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  dateFilter === "today"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                    : "bg-gray-50 dark:bg-neutral-900 text-gray-500 hover:bg-gray-100"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter("custom")}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  dateFilter === "custom"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                    : "bg-gray-50 dark:bg-neutral-900 text-gray-500 hover:bg-gray-100"
                }`}
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        {dateFilter === "custom" && (
          <div className="flex gap-4 items-end animate-in fade-in slide-in-from-top-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-900 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-900 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-800">
                <th
                  className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 cursor-pointer hover:text-primary-600"
                  onClick={() => {
                    setSortBy("id");
                    setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                  }}
                >
                  <div className="flex items-center gap-2">
                    Order ID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  User
                </th>
                <th
                  className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 cursor-pointer hover:text-primary-600"
                  onClick={() => {
                    setSortBy("created_at");
                    setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                  }}
                >
                  <div className="flex items-center gap-2">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Items
                </th>
                <th
                  className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 cursor-pointer hover:text-primary-600"
                  onClick={() => {
                    setSortBy("total_amount");
                    setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                  }}
                >
                  <div className="flex items-center gap-2">
                    Total <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                        #{order.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {order.user_name || "N/A"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {order.user_email || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400">
                        {order.total_items} Items
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-primary-600 dark:text-primary-400 italic">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status || "CONFIRMED"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/sales/orders/${order.id}`)}
                        className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700 hover:text-primary-600 transition-all shadow-sm active:scale-95"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic"
                  >
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="p-6 border-t border-gray-100 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 italic">
              Showing {orders.length} of {pagination.totalCount} records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage - 1,
                  }))
                }
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 bg-gray-50 dark:bg-neutral-900 rounded-lg text-xs font-black text-gray-700 dark:text-gray-300 flex items-center">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOrders;
