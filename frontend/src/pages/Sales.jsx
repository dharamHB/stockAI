import React, { useState, useEffect } from "react";
import { Plus, Search, ShoppingCart, Download } from "lucide-react";
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
  const [formData, setFormData] = useState({ product_id: "", quantity: 1 });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSales(pagination.currentPage);
    fetchProducts();
  }, [pagination.currentPage]);

  const fetchSales = async (page = 1) => {
    showLoader();
    try {
      const response = await fetch(
        `${API_URL}/api/sales?page=${page}&limit=${pagination.limit}`
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

  const handleExport = (format) => {
    showLoader();
    window.open(`${API_URL}/api/sales/export/${format}`, "_blank");
    setTimeout(hideLoader, 1000);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      setProducts(data.filter((p) => p.status === "active"));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const product = products.find(
      (p) => p.id === parseInt(formData.product_id)
    );
    if (!product) return;

    const total_amount = product.price * formData.quantity;

    showLoader();
    try {
      const response = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, total_amount }),
      });

      if (response.ok) {
        fetchSales(pagination.currentPage);
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error creating sale:", error);
    } finally {
      hideLoader();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ product_id: "", quantity: 1 });
  };

  const filteredSales = sales.filter(
    (sale) =>
      sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Record New Sale
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <h3 className="text-2xl font-bold mt-2 text-gray-900">
            $
            {sales
              .reduce((acc, curr) => acc + Number(curr.total_amount), 0)
              .toFixed(2)}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Units Sold</p>
          <h3 className="text-2xl font-bold mt-2 text-gray-900">
            {sales.reduce((acc, curr) => acc + curr.quantity, 0)}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">
            Average Order Value
          </p>
          <h3 className="text-2xl font-bold mt-2 text-gray-900">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales transactions..."
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
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-center">Quantity</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(sale.sale_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {sale.product_name}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    {sale.sku}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-semibold">
                      {sale.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-primary-600">
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
        title="Record New Sale"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Product
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              value={formData.product_id}
              onChange={(e) =>
                setFormData({ ...formData, product_id: e.target.value })
              }
            >
              <option value="">Choose a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${Number(p.price).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-bold text-lg text-primary-600">
              $
              {formData.product_id
                ? (
                    products.find((p) => p.id === parseInt(formData.product_id))
                      ?.price * formData.quantity
                  ).toFixed(2)
                : "0.00"}
            </span>
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
              Confirm Sale
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sales;
