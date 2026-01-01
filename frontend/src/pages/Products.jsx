import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Upload,
  Download,
  ShoppingBag,
  LayoutGrid,
  List,
} from "lucide-react";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useLoading } from "../context/LoadingContext";
import { useCart } from "../context/CartContext";
import API_URL from "../config";

const Products = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const { addToCart, getCartCount } = useCart();
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);
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
    image_url: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);
  const userRole = localStorage.getItem("userRole");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Date filter states
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Stats state
  const [stats, setStats] = useState({
    lowStockCount: 0,
    outOfStockCount: 0,
    todaysSalesCount: 0,
  });

  useEffect(() => {
    fetchProducts(pagination.currentPage);
    fetchStats();
  }, [pagination.currentPage, dateFilter, customStartDate, customEndDate]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/stats`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching product stats:", error);
    }
  };

  const [processingId, setProcessingId] = useState(null);

  const handleAddToCart = (product) => {
    const availableStock = product.stock_quantity || 0;

    if (availableStock < 1) {
      toast.error(`${product.name} is out of stock!`, {
        icon: "❌",
        id: `out-of-stock-${product.id}`,
      });
      return;
    }

    addToCart(product, 1, availableStock);
  };

  const fetchProducts = async (page = 1) => {
    showLoader();
    try {
      let url = `${API_URL}/api/products?page=${page}&limit=${pagination.limit}`;

      // Add date filtering
      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        url += `&startDate=${today.toISOString()}&endDate=${endOfDay.toISOString()}`;
      } else if (dateFilter === "custom" && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        url += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });
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

  const handleExport = async (format) => {
    showLoader();
    try {
      const response = await fetch(`${API_URL}/api/products/export/${format}`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_${new Date().getTime()}.${format}`;
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/products/import`, {
        method: "POST",
        headers: {
          "x-auth-token": token,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Import successful!");
        if (data.errors) {
          console.error("Import errors:", data.errors);
          toast.error("Some items had errors, check console.");
        }
        fetchProducts(pagination.currentPage);
      } else {
        toast.error("Import failed: " + data.error);
      }
    } catch (error) {
      console.error("Error importing file:", error);
      toast.error("Error importing file");
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
      const token = localStorage.getItem("token");

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingId
            ? "Product updated successfully!"
            : "Product created successfully!"
        );
        fetchProducts(pagination.currentPage);
        handleCloseModal();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error saving product");
    } finally {
      hideLoader();
    }
  };

  const handleDelete = (id) => {
    setDeleteProductId(id);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteProductId) {
      showLoader();
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/products/${deleteProductId}`, {
          method: "DELETE",
          headers: {
            "x-auth-token": token,
          },
        });
        toast.success("Product deleted successfully!");
        fetchProducts(pagination.currentPage);
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Error deleting product");
      } finally {
        hideLoader();
        setDeleteProductId(null);
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
      image_url: product.image_url || "",
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
      image_url: "",
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
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            Catalog Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Manage your retail portfolio and inventory assets
          </p>
        </div>
        <div className="flex gap-4 flex-wrap justify-end">
          <button
            onClick={() => navigate("/cart")}
            className="bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-primary-100 dark:border-primary-900/30 px-5 py-2.5 rounded-xl flex items-center gap-3 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all relative shadow-sm font-black uppercase tracking-widest text-[10px]"
          >
            <ShoppingBag className="w-4 h-4" />
            Registry Cart
            {getCartCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#121212] animate-bounce">
                {getCartCount()}
              </span>
            )}
          </button>
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
          {(userRole === "admin" || userRole === "super_admin") && (
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
                className="bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 px-5 py-2.5 rounded-xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm font-black uppercase tracking-widest text-[10px]"
              >
                <Upload className="w-4 h-4" />
                Ingest
              </button>
            </>
          )}
          {(userRole === "admin" || userRole === "super_admin") && (
            <div className="flex bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
                title="Grid Matrix"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
                title="List Matrix"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
          {(userRole === "admin" || userRole === "super_admin") && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-3 hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]"
            >
              <Plus className="w-4 h-4" />
              New Asset
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic mb-1">
                Low Resource
              </p>
              <p className="text-3xl font-black text-orange-600 dark:text-orange-500 italic">
                {stats.lowStockCount}
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/10 rounded-2xl flex items-center justify-center border border-orange-100 dark:border-orange-900/20 shadow-sm transition-transform group-hover:scale-110">
              <svg
                className="w-7 h-7 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic mb-1">
                Depleted Stock
              </p>
              <p className="text-3xl font-black text-red-600 dark:text-red-500 italic">
                {stats.outOfStockCount}
              </p>
            </div>
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-900/20 shadow-sm transition-transform group-hover:scale-110">
              <svg
                className="w-7 h-7 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic mb-1">
                Active Orders
              </p>
              <p className="text-3xl font-black text-primary-600 dark:text-primary-400 italic">
                {stats.todaysSalesCount}
              </p>
            </div>
            <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/10 rounded-2xl flex items-center justify-center border border-primary-100 dark:border-primary-900/20 shadow-sm transition-transform group-hover:scale-110">
              <svg
                className="w-7 h-7 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 italic">
              Temporal Asset Filtering
            </label>
            <div className="flex gap-3 flex-wrap">
              {[
                { id: "all", label: "Global Ledger" },
                { id: "today", label: "Cycle: Today" },
                { id: "custom", label: "Custom Domain" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setDateFilter(filter.id);
                    if (filter.id !== "custom") {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }
                  }}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    dateFilter === filter.id
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                      : "bg-gray-50 dark:bg-neutral-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-transparent dark:border-neutral-800"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {dateFilter === "custom" && (
            <div className="flex gap-4 items-end animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 italic px-1">
                  Origin
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 italic px-1">
                  Terminal
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="QUERY ASSET REGISTRY..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-black uppercase tracking-widest text-[11px] placeholder-gray-400 dark:placeholder-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-6 py-2 border border-gray-100 dark:border-neutral-800 rounded-xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-[10px] transition-all">
            <Filter className="w-4 h-4" />
            Criteria
          </button>
        </div>

        <div className="p-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const availableStock = product.stock_quantity || 0;
                    return (
                  <div
                    key={product.id}
                    className="group bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-xl dark:hover:shadow-primary-900/10 transition-all duration-500 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-neutral-800">
                      <img
                        src={
                          product.image_url ||
                          "https://images.unsplash.com/photo-1586769852044-692d6e3703a0?w=800"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <span className="px-3 py-1 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 shadow-sm border border-white/50 dark:border-white/10">
                          {product.category}
                        </span>
                        {availableStock <= 5 && (
                          <span className="px-3 py-1 bg-red-500/90 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm animate-pulse">
                            Low Stock
                          </span>
                        )}
                      </div>
                      {(userRole === "admin" || userRole === "super_admin") && (
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2.5 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-xl hover:scale-105"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2.5 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl text-gray-500 hover:text-red-600 transition-all shadow-xl hover:scale-105"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono tracking-tighter">
                          {product.sku}
                        </p>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1 font-medium leading-relaxed">
                        {product.description || "No description available."}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-neutral-800/50">
                        <div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">
                            Price
                          </p>
                          <p className="text-xl font-black text-gray-900 dark:text-gray-100 italic">
                            ${Number(product.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">
                            Stock
                          </p>
                          <p
                            className={`text-sm font-black ${
                              availableStock > 0
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-red-600 dark:text-red-500"
                            }`}
                          >
                            {availableStock} unit{availableStock !== 1 && "s"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={
                          availableStock === 0 || processingId === product.id
                        }
                        className={`mt-4 w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 shadow-lg ${
                          availableStock === 0
                            ? "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed shadow-none"
                            : "bg-gray-900 dark:bg-primary-600 text-white hover:bg-primary-600 dark:hover:bg-primary-500 hover:shadow-primary-200 dark:hover:shadow-primary-900/30"
                        }`}
                      >
                        {processingId === product.id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            {availableStock === 0
                              ? "Out of Stock"
                              : "Add to Cart"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const availableStock = product.stock_quantity || 0;
                return (
                  <div
                    key={product.id}
                    className="group bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex items-center gap-6" >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 dark:bg-neutral-800 flex-shrink-0 border border-gray-100 dark:border-neutral-800">
                      <img
                        src={
                          product.image_url ||
                          "https://images.unsplash.com/photo-1586769852044-692d6e3703a0?w=400"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate italic">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black font-mono text-gray-400 dark:text-gray-500 uppercase tracking-tighter bg-gray-50 dark:bg-neutral-900 px-2 py-0.5 rounded">
                              {product.sku}
                            </span>
                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-3 border-l border-gray-200 dark:border-neutral-800">
                              {product.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-900 dark:text-gray-100 italic tracking-tighter">
                            ${Number(product.price).toFixed(2)}
                          </p>
                          <p
                            className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                              availableStock > 0
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-red-500"
                            }`}
                          >
                            {availableStock} ASSETS IN RESERVE
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 font-medium italic">
                        {product.description ||
                          "NO SYSTEM DESCRIPTION PROVIDED"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={
                          availableStock === 0 || processingId === product.id
                        }
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all shadow-lg active:scale-95 ${
                          availableStock === 0
                            ? "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed"
                            : "bg-gray-900 dark:bg-primary-600 text-white hover:bg-primary-700 dark:hover:bg-primary-500 shadow-primary-500/10"
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Acquire
                      </button>

                      {(userRole === "admin" || userRole === "super_admin") && (
                        <div className="flex gap-2 border-l border-gray-100 dark:border-neutral-800 pl-4">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-xl transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filteredProducts.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-24 h-24 bg-gray-50 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-neutral-800">
                <Search className="w-10 h-10 text-gray-300 dark:text-neutral-700" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 italic">
                Registry Null
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2 text-sm font-medium">
                No matching assets identified in the current sector. Try a
                different query.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="px-8 py-6 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 italic">
            Visualizing{" "}
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
        title={
          editingId ? `Edit Asset: ${formData.name}` : "Initialize New Asset"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6 lg:p-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
              Asset Designation
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                Logistics ID (SKU)
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono font-bold"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                Sector / Category
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                Valuation ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                Operational Status
              </label>
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold appearance-none cursor-pointer"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="active">ACTIVE</option>
                <option value="inactive">INACTIVE</option>
                <option value="archived">ARCHIVED</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
              Visual Asset Pointer (URL)
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
              placeholder="https://assets.nexus.com/id_99.jpg"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
              Asset Specifications
            </label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium min-h-[100px]"
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
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
              {editingId ? "Commit Changes" : "Initialize Asset"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        type="danger"
      />
    </div>
  );
};

export default Products;
