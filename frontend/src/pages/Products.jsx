import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Upload,
  Download,
} from "lucide-react";
import Modal from "../components/Modal";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const Products = () => {
  const { showLoader, hideLoader } = useLoading();
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    status: "active",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    fetchProducts(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchProducts = async (page = 1) => {
    showLoader();
    try {
      const response = await fetch(
        `${API_URL}/api/products?page=${page}&limit=${pagination.limit}`
      );
      const data = await response.json();
      setProducts(data.products);
      setPagination((prev) => ({
        ...prev,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      hideLoader();
    }
  };

  const handleExport = (format) => {
    showLoader();
    const url = `${API_URL}/api/products/export/${format}`;
    window.open(url, "_blank");
    // Since window.open triggers a download, we can't easily know when it's done,
    // so we'll just hide the loader after a short delay for UX.
    setTimeout(hideLoader, 1000);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    showLoader();
    try {
      const response = await fetch(`${API_URL}/api/products/import`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        if (data.errors) {
          console.error("Import errors:", data.errors);
          alert("Some items had errors, check console for details.");
        }
        fetchProducts(pagination.currentPage);
      } else {
        alert("Import failed: " + data.error);
      }
    } catch (error) {
      console.error("Error importing file:", error);
      alert("Error importing file");
    } finally {
      hideLoader();
    }

    // Reset file input
    e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const url = editingId
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchProducts(pagination.currentPage);
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      showLoader();
      try {
        await fetch(`${API_URL}/api/products/${id}`, {
          method: "DELETE",
        });
        fetchProducts(pagination.currentPage);
      } catch (error) {
        console.error("Error deleting product:", error);
      } finally {
        hideLoader();
      }
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      status: product.status,
      description: product.description || "",
    });
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      sku: "",
      category: "",
      price: "",
      status: "active",
      description: "",
    });
    setEditingId(null);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Products</h1>
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
          {userRole === "admin" && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={handleImportClick}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Import CSV
              </button>
            </>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or category..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-gray-600">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ${Number(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          product.status === "active"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No products found matching your search.
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
        title={editingId ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
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
              {editingId ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
