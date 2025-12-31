import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import API_URL from "../config";
import { useCart } from "../context/CartContext";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [error, setError] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    if (sessionId && !processedRef.current) {
      processedRef.current = true;
      verifyPayment();
    } else if (!sessionId) {
      setStatus("error");
      setError("No session ID found");
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/sales/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        clearCart();
        toast.success("Payment verified! Order placed successfully.");
      } else {
        setStatus("error");
        setError(data.error || "Payment verification failed");
        toast.error(data.error || "Payment verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setStatus("error");
      setError("An error occurred during verification");
      toast.error("An error occurred during verification");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#181818] rounded-2xl shadow-2xl p-10 text-center border border-gray-100 dark:border-neutral-800">
        {status === "verifying" && (
          <div className="space-y-6">
            <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-500 animate-spin mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 italic">
                Verifying Transaction
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Establishing secure connection with gateway...
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-8">
            <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto border border-green-100 dark:border-green-900/30">
              <CheckCircle className="w-14 h-14 text-green-600 dark:text-green-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
                Payment Validated
              </h2>
              <p className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                Asset acquisition complete.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-[10px] leading-relaxed max-w-[250px] mx-auto uppercase tracking-tighter">
                Your credentials have been authenticated and the order ledger
                has been updated.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-4">
              <button
                onClick={() => navigate("/my-orders")}
                className="w-full bg-primary-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
              >
                Access Order Ledger
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all border border-gray-100 dark:border-neutral-800"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-8">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/30">
              <XCircle className="w-14 h-14 text-red-600 dark:text-red-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
                Acquisition Failed
              </h2>
              <p className="text-red-600 dark:text-red-400 font-black uppercase tracking-widest text-[10px] bg-red-50 dark:bg-red-900/10 py-2 px-4 rounded-lg inline-block">
                {error}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-[10px] leading-relaxed uppercase tracking-tighter">
                Critical error detected during gateway verification.
                <br />
                No assets were transferred.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => navigate("/cart")}
                className="w-full bg-gray-900 dark:bg-neutral-800 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black dark:hover:bg-neutral-700 transition-all shadow-lg active:scale-95"
              >
                Revert to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
