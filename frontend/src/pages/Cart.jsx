import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const Cart = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();
  const [checkoutError, setCheckoutError] = useState("");

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(item.id, newQuantity, item.availableStock);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!", {
        icon: "🛒",
      });
      return;
    }

    setCheckoutError("");
    showLoader();

    try {
      // Validate stock availability before checkout
      const stockCheckPromises = cartItems.map(async (item) => {
        const response = await fetch(`${API_URL}/api/inventory`);
        const data = await response.json();
        const inventoryItem = data.items.find(
          (inv) => inv.product_id === item.id
        );

        if (!inventoryItem || inventoryItem.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.name}. Available: ${
              inventoryItem?.quantity || 0
            }, Required: ${item.quantity}`
          );
        }
        return true;
      });

      await Promise.all(stockCheckPromises);

      // Create Stripe Checkout Session
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/sales/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({ items: cartItems }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Direct redirect to Stripe Checkout URL (modern approach)
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutError(error.message || "An error occurred during checkout");
      toast.error(error.message || "An error occurred during checkout", {
        icon: "⚠️",
        duration: 5000,
        id: "checkout-error",
      });
    } finally {
      hideLoader();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-neutral-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 italic">
          Your cart is empty
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8 max-w-xs font-medium">
          Looks like you haven't added anything yet. Start exploring our premium
          collection!
        </p>
        <button
          onClick={() => navigate("/products")}
          className="bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center gap-3 font-black uppercase tracking-widest text-xs"
        >
          <ArrowLeft className="w-5 h-5" />
          Browse Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            Acquisition Manifest
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Reviewing {cartItems.length}{" "}
            {cartItems.length === 1 ? "priority asset" : "priority assets"} for
            allocation
          </p>
        </div>
        <button
          onClick={() => navigate("/products")}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-3 font-black uppercase tracking-widest text-[10px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Exploration
        </button>
      </div>

      {checkoutError && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 font-medium text-sm">
          <span className="flex-shrink-0">⚠️</span>
          {checkoutError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6 transition-all hover:shadow-md"
            >
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 bg-gray-50 dark:bg-neutral-900 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-neutral-800">
                  <ShoppingCart className="w-8 h-8 text-gray-300 dark:text-neutral-700" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-xl italic truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-neutral-900/50 px-2 py-1 rounded-md border border-gray-100 dark:border-neutral-800">
                      REF: {item.sku}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-500 italic flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                      Availability: {item.availableStock} Units
                    </span>
                  </div>

                  <div className="flex items-center gap-6 mt-6">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 p-1 rounded-xl border border-gray-100 dark:border-neutral-800">
                      <button
                        onClick={() =>
                          handleQuantityChange(item, item.quantity - 1)
                        }
                        className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all text-gray-600 dark:text-gray-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-black dark:text-gray-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.availableStock}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-600 flex items-center gap-2 group transition-colors"
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Remove
                      </span>
                    </button>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-gray-900 dark:text-gray-100 italic">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
                    ${item.price.toFixed(2)} unit
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6 sticky top-6">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 italic mb-6">
              Executive Summary
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <span>Accumulated Subtotal</span>
                <span className="text-gray-900 dark:text-gray-100">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <span>Logistics Fee</span>
                <span className="text-primary-600 dark:text-primary-400 italic">
                  Complimentary
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-neutral-800 pt-4">
                <div className="flex justify-between text-xl font-black text-gray-900 dark:text-gray-100 italic">
                  <span>Grand Total</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/30 active:scale-95 flex items-center justify-center gap-3 border border-primary-500/20"
            >
              <CreditCard className="w-5 h-5" />
              Authorize Transaction
            </button>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
                Secure transaction gateway enabled.
                <br />
                <span className="font-black text-gray-500 dark:text-gray-400">
                  DEMO KEY:
                </span>{" "}
                4242 ... 4242
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
