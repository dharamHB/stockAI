import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import RoleManagementModal from "../components/RoleManagementModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";
import { getAvailableRoles } from "../utils/permissions";
import { Shield } from "lucide-react";

const Users = () => {
  const { showLoader, hideLoader } = useLoading();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Date filter states
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'custom'
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    fetchUsers(pagination.currentPage);
    updateRoles();

    const handleUpdate = () => updateRoles();
    window.addEventListener("rolePermissionsUpdated", handleUpdate);
    return () =>
      window.removeEventListener("rolePermissionsUpdated", handleUpdate);
  }, [pagination.currentPage, dateFilter, customStartDate, customEndDate]);

  const updateRoles = () => {
    setAvailableRoles(getAvailableRoles());
  };

  const fetchUsers = async (page = 1) => {
    showLoader();
    try {
      let url = `${API_URL}/api/users?page=${page}&limit=${pagination.limit}`;

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

      const response = await fetch(url);
      const data = await response.json();
      setUsers(data.users);
      setPagination((prev) => ({
        ...prev,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      hideLoader();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const url = editingId
        ? `${API_URL}/api/users/${editingId}`
        : `${API_URL}/api/users`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingId
            ? "User updated successfully!"
            : "User created successfully!"
        );
        fetchUsers(pagination.currentPage);
        handleCloseModal();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save user");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Error saving user");
    } finally {
      hideLoader();
    }
  };

  const handleDelete = (id) => {
    setDeleteUserId(id);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteUserId) {
      showLoader();
      try {
        await fetch(`${API_URL}/api/users/${deleteUserId}`, {
          method: "DELETE",
        });
        toast.success("User deleted successfully!");
        fetchUsers(pagination.currentPage);
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Error deleting user");
      } finally {
        hideLoader();
        setDeleteUserId(null);
      }
    }
  };

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", email: "", role: "user", password: "" });
    setEditingId(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
            Personnel Registry
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Manage system access and operational clearance levels
          </p>
        </div>
        <div className="flex gap-4 flex-wrap justify-end">
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm font-black uppercase tracking-widest text-[10px]"
          >
            <Shield className="w-4 h-4 text-primary-500" />
            Security protocols
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-3 hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]"
          >
            <Plus className="w-4 h-4" />
            Authorize Profile
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-6 mb-8 transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest italic px-1">
              Temporal filtering
            </label>
            <div className="flex gap-3 flex-wrap">
              {[
                { id: "all", label: "Global Pool" },
                { id: "today", label: "Cycle: Today" },
                { id: "custom", label: "Range Domain" },
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
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="QUERY USER REGISTRY..."
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
                  Operator
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800">
                  Clearance
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800">
                  Authorized
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800 text-right">
                  Settings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-all group"
                >
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 dark:text-gray-100 italic transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-black font-mono text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-0.5">
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        user.role === "super_admin"
                          ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                          : user.role === "admin"
                          ? "bg-primary-500/10 border-primary-500/20 text-primary-600 dark:text-primary-400"
                          : "bg-gray-500/10 border-gray-500/20 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase italic">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-xl transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === "super_admin"}
                        className={`p-2 rounded-xl transition-all ${
                          user.role === "super_admin"
                            ? "opacity-10 cursor-not-allowed text-gray-300"
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No users found matching your search.
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
            | Profile Pool:{" "}
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
          editingId ? `Edit Access: ${formData.name}` : "Initialize New Account"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6 lg:p-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
              Full Designation
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
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
              System Identifier (Email)
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
              Access Cipher{" "}
              {editingId && (
                <span className="text-gray-400 font-normal text-[9px] lowercase italic pl-2">
                  (Leave blank to preserve current state)
                </span>
              )}
            </label>
            <input
              type="password"
              required={!editingId}
              placeholder={editingId ? "RETAINED" : "••••••••"}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono font-bold"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 italic">
              Clearance Level
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold appearance-none cursor-pointer capitalize"
              value={formData.role}
              disabled={
                editingId &&
                users.find((u) => u.id === editingId)?.role === "super_admin"
              }
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              {availableRoles.map((role) => (
                <option key={role} value={role} className="capitalize">
                  {role.replace("_", " ")}
                </option>
              ))}
            </select>
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
              {editingId ? "Commit Update" : "Authorize Access"}
            </button>
          </div>
        </form>
      </Modal>

      <RoleManagementModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        type="danger"
      />
    </div>
  );
};

export default Users;
