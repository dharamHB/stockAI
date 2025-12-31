import React, { useState, useEffect } from "react";
import { Package, Calendar, Hash } from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const MyOrders = () => {
  const { showLoader, hideLoader } = useLoading();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  useEffect(() => {
    fetchOrders(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchOrders = async (page = 1) => {
    showLoader();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/sales/my-orders?page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            "x-auth-token": token,
          },
        }
      );
      const data = await response.json();
      setOrders(data.orders || []);
      setPagination((prev) => ({
        ...prev,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      }));
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      hideLoader();
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            Acquisition History
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
            Visualizing{" "}
            <span className="text-gray-900 dark:text-gray-100 font-black not-italic">
              {pagination.totalCount}
            </span>{" "}
            confirmed system logs
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-300 dark:text-neutral-700" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 italic mb-2">
              Order Ledger Empty
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium italic">
              Commence acquisition to populate this workspace.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-8 hover:shadow-xl dark:hover:shadow-primary-900/10 transition-all duration-500 group"
            >
              <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 border border-primary-100/50 dark:border-primary-800/20 shadow-sm">
                    <Package className="w-8 h-8 text-primary-600 dark:text-primary-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Hash className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      <span className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-xs">
                        LOG_ID: {order.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 italic">
                      <Calendar className="w-3.5 h-3.5" />
                      {order.sale_date
                        ? new Date(order.sale_date).toLocaleString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Date Pending"}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status || "CONFIRMED"}
                </span>
              </div>

              <div className="border-t border-gray-100 dark:border-neutral-800/50 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-700"></span>
                      Asset Designation
                    </p>
                    <p className="font-black text-gray-900 dark:text-gray-100 text-xl italic leading-tight">
                      {order.product_name}
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono tracking-tighter uppercase">
                      SYSTEM_REF: {order.sku}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-700"></span>
                      Allocation Volume
                    </p>
                    <p className="font-black text-gray-900 dark:text-gray-100 text-xl italic">
                      {order.quantity}{" "}
                      <span className="text-[10px] uppercase tracking-widest not-italic text-gray-400">
                        Units
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500/50"></span>
                      Settlement Value
                    </p>
                    <p className="font-black text-primary-600 dark:text-primary-400 text-3xl italic tracking-tighter">
                      ${Number(order.total_amount).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black">
                      Valuation: ${Number(order.price).toFixed(2)}/Unit
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 px-8 py-6">
          <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">
            Scanning page{" "}
            <span className="text-gray-900 dark:text-gray-100 not-italic">
              {pagination.currentPage}
            </span>{" "}
            of{" "}
            <span className="text-gray-900 dark:text-gray-100 not-italic">
              {pagination.totalPages}
            </span>{" "}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage - 1,
                }))
              }
              disabled={pagination.currentPage === 1}
              className="px-6 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-30 transition-all shadow-sm"
            >
              Backward
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage + 1,
                }))
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-6 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-30 transition-all shadow-sm"
            >
              Forward
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
