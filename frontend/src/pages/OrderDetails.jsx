import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Calendar,
  Hash,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";
import toast from "react-hot-toast";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    showLoader();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/sales/orders/${id}`, {
        headers: {
          "x-auth-token": token,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrderData(data);
      } else {
        toast.error("Failed to fetch order details");
        navigate("/my-orders");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Error fetching order details");
    } finally {
      hideLoader();
    }
  };

  if (!orderData) return null;

  const { order, items } = orderData;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/20";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/20";
      default:
        return "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-400 border-gray-200/50 dark:border-neutral-700";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Return to Ledger
        </button>
        <div className="flex items-center gap-3">
          <span
            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(
              order.status
            )}`}
          >
            {order.status || "CONFIRMED"}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-8 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/20">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 italic">
                  ORDER_MANIFEST: #{order.id}
                </h1>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 italic">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(order.created_at).toLocaleString("en-US", {
                    month: "long",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {items.length} Unique Assets
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic mb-1">
                Settlement Aggregate
              </p>
              <p className="text-4xl font-black text-primary-600 dark:text-primary-400 italic tracking-tighter">
                ${Number(order.total_amount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] italic flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              Asset Allocation Details
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800/50 p-6 rounded-2xl flex items-center gap-6 group hover:border-primary-500/30 transition-all duration-500 hover:shadow-lg dark:hover:shadow-primary-900/10"
                >
                  <div className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-neutral-700/50 shadow-sm relative group">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-200 dark:text-neutral-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-gray-100 text-lg italic group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {item.product_name}
                        </h4>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 font-mono tracking-widest uppercase mt-1">
                          SKU_REF: {item.sku}
                        </p>
                        {item.description && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-1 italic font-medium">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-gray-900 dark:text-gray-100 text-xl italic tracking-tighter">
                          ${Number(item.total_amount).toFixed(2)}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          {item.quantity} UNITS @ $
                          {Number(item.total_amount / item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-neutral-800">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] italic flex items-center gap-3">
                <CreditCard className="w-4 h-4" />
                Transaction Protocol
              </h3>
              <div className="bg-gray-50 dark:bg-neutral-900/50 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800/50 space-y-4 font-medium">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Methodology:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-black">
                    STRIPE_CREDIT_GATEWAY
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Session_ID:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-mono text-[9px] max-w-[150px] truncate">
                    {order.stripe_session_id}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pt-2 border-t border-gray-100 dark:border-neutral-800/50">
                  <span className="text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Validation Status:
                  </span>
                  <span className="text-green-600 dark:text-green-500 font-black flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    VERIFIED_CLEARANCE
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] italic flex items-center gap-3 text-right justify-end">
                Financial Summary
              </h3>
              <div className="space-y-3 px-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                  <span className="text-gray-400">Inventory Subtotal:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    ${Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                  <span className="text-gray-400">Logistics Allocation:</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    COMPLIMENTARY
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-neutral-800">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 italic">
                    Final Liquidation:
                  </span>
                  <span className="text-3xl font-black text-primary-600 dark:text-primary-400 italic tracking-tighter">
                    ${Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
