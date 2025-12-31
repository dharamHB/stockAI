import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Pencil,
  AlertTriangle,
  TrendingUp,
  Search,
  Download,
} from "lucide-react";
import Modal from "../components/Modal";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const Inventory = () => {
  const { showLoader, hideLoader } = useLoading();
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });
  const [formData, setFormData] = useState({
    quantity: 0,
    low_stock_threshold: 10,
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInventory(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchInventory = async (page = 1) => {
    showLoader();
    try {
      const response = await fetch(
        `${API_URL}/api/inventory?page=${page}&limit=${pagination.limit}`
      );
      const data = await response.json();
      setInventory(data.items);
      setPagination((prev) => ({
        ...prev,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      }));
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      hideLoader();
    }
  };

  const handleExport = (format) => {
    showLoader();
    window.open(`${API_URL}/api/inventory/export/${format}`, "_blank");
    toast.success(`Exporting ${format.toUpperCase()}...`);
    setTimeout(hideLoader, 1000);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await fetch(`${API_URL}/api/inventory/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Inventory updated successfully!");
        fetchInventory(pagination.currentPage);
        handleCloseModal();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update inventory");
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast.error("Error updating inventory");
    } finally {
      hideLoader();
    }
  };

  const handleEdit = (item) => {
    setFormData({
      quantity: item.quantity,
      low_stock_threshold: item.low_stock_threshold,
    });
    setEditingId(item.id);
    setSelectedProduct(item.product_name);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ quantity: 0, low_stock_threshold: 10 });
    setEditingId(null);
    setSelectedProduct(null);
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            Asset Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Real-time tracking of logistics and warehousing
          </p>
        </div>
        <div className="flex gap-4">
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
        </div>
      </div>

      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#181818]">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="SEARCH LOGISTICS REGISTRY..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-black uppercase tracking-widest text-[11px] placeholder-gray-400 dark:placeholder-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-neutral-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-8 py-5">Asset Designation</th>
                <th className="px-8 py-5">Log-ID</th>
                <th className="px-8 py-5">Availability</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Sync Date</th>
                <th className="px-8 py-5 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50">
              {filteredInventory.map((item) => {
                const isLowStock = item.quantity <= item.low_stock_threshold;
                const percent = Math.min(
                  (item.quantity / (item.low_stock_threshold * 3)) * 100,
                  100
                );

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-all group ${
                      isLowStock ? "bg-red-50/10 dark:bg-red-900/5" : ""
                    }`}
                  >
                    <td className="px-8 py-5">
                      <p className="font-black text-gray-900 dark:text-gray-100 italic">
                        {item.product_name}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-neutral-900 px-2 py-0.5 rounded">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="w-32">
                        <div className="flex justify-between mb-1.5 px-0.5">
                          <span
                            className={`${
                              isLowStock ? "text-red-500" : "text-primary-600"
                            } font-black italic text-xs`}
                          >
                            {item.quantity} units
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              isLowStock ? "bg-red-500" : "bg-primary-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                          <AlertTriangle className="w-3 h-3" />
                          Critical
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 italic">
                      {new Date(item.last_updated).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 dark:text-primary-400 hover:scale-110 transition-transform inline-flex items-center gap-2 group p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Adjust
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-8 py-6 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 italic">
            Displaying{" "}
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
            | Pool:{" "}
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
        title={`Adjust Stock: ${selectedProduct}`}
      >
        <form onSubmit={handleUpdate} className="space-y-6 lg:p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                Quantifiable Assets
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                Critical Alert Boundary
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                value={formData.low_stock_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    low_stock_threshold: parseInt(e.target.value),
                  })
                }
              />
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic font-black uppercase tracking-tighter">
                Synchronized alerts will trigger below this designated
                threshold.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Abort
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
            >
              Execute Sync
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
