import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Search, ShoppingCart, Download, Trash2 } from "lucide-react";
import Modal from "../components/Modal";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const Sales = () => {
  const { showLoader, hideLoader } = useLoading();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });
  const [cartItems, setCartItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    product_id: "",
    quantity: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSales(pagination.currentPage);
    fetchProducts();
  }, [pagination.currentPage]);

  const fetchSales = async (page = 1) => {
    showLoader();
    try {
      const response = await fetch(
        `${API_URL}/api/sales?page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      setSales(data.sales);
      setPagination((prev) => ({
        ...prev,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      }));
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      hideLoader();
    }
  };

  const handleExport = async (format) => {
    showLoader();
    try {
      const response = await fetch(`${API_URL}/api/sales/export/${format}`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sales_${new Date().getTime()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Exporting ${format.toUpperCase()}...`);
      } else {
        toast.error(`Failed to export ${format.toUpperCase()}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Export error");
    } finally {
      hideLoader();
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });
      const data = await response.json();
      setProducts(data.filter((p) => p.status === "active"));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addItemToCart = () => {
    const product = products.find(
      (p) => p.id === parseInt(currentItem.product_id)
    );
    if (!product) return;

    if (currentItem.quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.product_id === product.id
    );

    if (existingItemIndex > -1) {
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += parseInt(currentItem.quantity);
      setCartItems(updatedCart);
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          price: Number(product.price),
          quantity: parseInt(currentItem.quantity),
        },
      ]);
    }
    setCurrentItem({ product_id: "", quantity: 1 });
  };

  const removeFromCart = (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    setCartItems(updatedCart);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    showLoader();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/sales/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ items: cartItems }),
      });

      if (response.ok) {
        toast.success("Order placed successfully! 🎉");
        fetchSales(pagination.currentPage);
        handleCloseModal();
      } else {
        const errorData = await response.json();
        toast.error(
          "Checkout failed: " + (errorData.error || errorData.message)
        );
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Error during checkout");
    } finally {
      hideLoader();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCartItems([]);
    setCurrentItem({ product_id: "", quantity: 1 });
  };

  const filteredSales = sales.filter(
    (sale) =>
      sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            Sales Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Registry of all completed commercial transactions
          </p>
        </div>
        <div className="flex gap-4 flex-wrap justify-end">
          <button
            onClick={() => handleExport("csv")}
            className="bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 px-5 py-2.5 rounded-xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm font-black uppercase tracking-widest text-[10px]"
          >
            <Download className="w-4 h-4" />
            CSV Data
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 px-5 py-2.5 rounded-xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm font-black uppercase tracking-widest text-[10px]"
          >
            <Download className="w-4 h-4" />
            PDF Report
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-3 hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]"
          >
            <Plus className="w-4 h-4" />
            Execute Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 transition-all hover:shadow-md group">
          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic mb-1">
            Gross Revenue
          </p>
          <h3 className="text-3xl font-black text-primary-600 dark:text-primary-400 italic">
            $
            {sales
              .reduce((acc, curr) => acc + Number(curr.total_amount), 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          </h3>
        </div>
        <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 transition-all hover:shadow-md group">
          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic mb-1">
            Asset Liquidation
          </p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            {sales.reduce((acc, curr) => acc + curr.quantity, 0)} UNITS
          </h3>
        </div>
        <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 transition-all hover:shadow-md group">
          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic mb-1">
            Avg Order Index
          </p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            $
            {sales.length > 0
              ? (
                  sales.reduce(
                    (acc, curr) => acc + Number(curr.total_amount),
                    0
                  ) / sales.length
                ).toFixed(2)
              : "0.00"}
          </h3>
        </div>
      </div>

      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="SEARCH LEDGER REGISTRY..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-black uppercase tracking-widest text-[11px] placeholder-gray-400 dark:placeholder-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-neutral-900/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800">
                  Timestamp
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800">
                  Asset
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800 text-center">
                  Qty
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800 text-right">
                  Settlement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-all group"
                >
                  <td className="px-8 py-5 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-tighter italic">
                    {new Date(sale.sale_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-gray-900 dark:text-gray-100 italic transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {sale.product_name}
                    </p>
                    <p className="text-[9px] font-black font-mono text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                      {sale.sku}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-neutral-800">
                      {sale.quantity}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-gray-900 dark:text-gray-100 italic text-lg tracking-tighter">
                    ${Number(sale.total_amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No sales records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-8 py-6 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 italic">
            Auditing{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {(pagination.currentPage - 1) * pagination.limit + 1}
            </span>{" "}
            -{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalCount
              )}
            </span>{" "}
            | Database Pool:{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {pagination.totalCount}
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
              Back
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
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Command Order / Registry"
      >
        <div className="space-y-8 lg:p-4">
          {/* Add Item Form */}
          <div className="bg-gray-50 dark:bg-neutral-900 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic">
              Asset Acquisition
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <select
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer appearance-none"
                  value={currentItem.product_id}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      product_id: e.target.value,
                    })
                  }
                >
                  <option value="">SELECT ASSET...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.toUpperCase()} — ${Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-32">
                <input
                  type="number"
                  min="1"
                  placeholder="QTY"
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      quantity: e.target.value,
                    })
                  }
                />
              </div>
              <button
                type="button"
                onClick={addItemToCart}
                disabled={!currentItem.product_id}
                className="px-6 py-3 bg-gray-900 dark:bg-primary-600 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-primary-500 disabled:opacity-50 transition-all active:scale-95 shadow-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Table */}
          <div className="border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-neutral-900/50">
                <tr>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800 text-center">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800 text-right">
                    Sum
                  </th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                {cartItems.map((item, index) => (
                  <tr key={index} className="group">
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900 dark:text-gray-100 italic text-xs">
                        {item.product_name}
                      </p>
                      <p className="text-[9px] font-black font-mono text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {item.sku}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-gray-100 dark:border-neutral-800">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-gray-100 italic">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {cartItems.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 italic"
                    >
                      Registry Empty — Waiting for input
                    </td>
                  </tr>
                )}
              </tbody>
              {cartItems.length > 0 && (
                <tfoot className="bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-100 dark:border-neutral-800">
                  <tr>
                    <td
                      colSpan="2"
                      className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 italic"
                    >
                      Aggregate Settlement:
                    </td>
                    <td className="px-6 py-5 text-right text-xl text-primary-600 dark:text-primary-400 font-black italic tracking-tighter">
                      ${cartTotal.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Discard Order
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
            >
              Finalize Settlement
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sales;
