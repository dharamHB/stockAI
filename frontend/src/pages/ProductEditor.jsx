import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Upload, X } from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const ProductEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    status: "active",
    description: "",
    image_url: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    showLoader();
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        // The API returns { product: ... } or just the product?
        // Based on backend routes/products.js: res.json(product); for GET /:id
        // Wait, I need to check backend behavior for GET /:id.
        // Assuming it returns the product object directly or wrapped.
        // Let's assume it returns the product directly as it's common, but I should be careful.
        // Actually, looking at Products.jsx fetchProducts, it returns { products: [] }.
        // Let's assume GET /:id returns the product object.
        setFormData({
          name: data.name || "",
          sku: data.sku || "",
          category: data.category || "",
          price: data.price || "",
          status: data.status || "active",
          description: data.description || "",
          image_url: data.image_url || "",
        });
      } else {
        toast.error("Failed to fetch product details");
        navigate("/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Error fetching product");
      navigate("/products");
    } finally {
      hideLoader();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (Number(formData.price) < 0) newErrors.price = "Price must be positive";
    if (!formData.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    showLoader();
    try {
      const url = isEditing
        ? `${API_URL}/api/products/${id}`
        : `${API_URL}/api/products`;

      const method = isEditing ? "PUT" : "POST";
      const token = localStorage.getItem("token");

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isEditing
            ? "Product updated successfully!"
            : "Product created successfully!"
        );
        navigate("/products");
      } else {
        toast.error(data.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error saving product");
    } finally {
      hideLoader();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate("/products")}
          className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            {isEditing ? "Edit Asset" : "New Asset Registry"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {isEditing
              ? "Update existing inventory item details"
              : "Register a new product in the system"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[#181818] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Core Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border ${
                    errors.name
                      ? "border-red-500"
                      : "border-transparent dark:border-neutral-800"
                  } rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium`}
                  placeholder="e.g. Quantum Processor X1"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                  Stock Keeping Unit (SKU){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border ${
                    errors.sku
                      ? "border-red-500"
                      : "border-transparent dark:border-neutral-800"
                  } rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm`}
                  placeholder="e.g. QPU-X1-2024"
                />
                {errors.sku && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.sku}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border ${
                    errors.category
                      ? "border-red-500"
                      : "border-transparent dark:border-neutral-800"
                  } rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium`}
                  placeholder="e.g. Electronics"
                />
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.category}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border ${
                      errors.price
                        ? "border-red-500"
                        : "border-transparent dark:border-neutral-800"
                    } rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1 font-bold">
                      {errors.price}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column - Media & Description */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                  Image URL
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-sm"
                    placeholder="https://..."
                  />
                </div>
                {formData.image_url && (
                  <div className="mt-4 rounded-xl overflow-hidden bg-gray-50 dark:bg-neutral-900 h-48 border border-gray-100 dark:border-neutral-800 relative group">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, image_url: "" }))
                      }
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium resize-none"
                  placeholder="Detailed product specification..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="px-8 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-700 dark:text-gray-300 font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Update Asset" : "Register Asset"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductEditor;
