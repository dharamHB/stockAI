import React, { useState, useEffect } from "react";
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
        fetchInventory(pagination.currentPage);
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Status</h1>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport("csv")}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Update Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const isLowStock = item.quantity <= item.low_stock_threshold;
                const percent = Math.min(
                  (item.quantity / (item.low_stock_threshold * 3)) * 100,
                  100
                );

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isLowStock ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-700">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              isLowStock ? "bg-red-500" : "bg-green-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(item.last_updated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-800 font-semibold text-sm flex items-center justify-end gap-1 w-full"
                      >
                        <Pencil className="w-4 h-4" />
                        Adjust
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
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalCount
              )}
            </span>{" "}
            of <span className="font-medium">{pagination.totalCount}</span>{" "}
            results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage - 1,
                }))
              }
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage + 1,
                }))
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Quantity
            </label>
            <input
              type="number"
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Alert Threshold
            </label>
            <input
              type="number"
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.low_stock_threshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  low_stock_threshold: parseInt(e.target.value),
                })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Alerts will trigger when stock drops below this number.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Update Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
