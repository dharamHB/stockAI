import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Modal from "../components/Modal";
import RoleManagementModal from "../components/RoleManagementModal";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";
import { getAvailableRoles } from "../utils/permissions";
import { Shield } from "lucide-react";

const Users = () => {
  const { showLoader, hideLoader } = useLoading();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
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

  useEffect(() => {
    fetchUsers(pagination.currentPage);
    updateRoles();

    const handleUpdate = () => updateRoles();
    window.addEventListener("rolePermissionsUpdated", handleUpdate);
    return () =>
      window.removeEventListener("rolePermissionsUpdated", handleUpdate);
  }, [pagination.currentPage]);

  const updateRoles = () => {
    setAvailableRoles(getAvailableRoles());
  };

  const fetchUsers = async (page = 1) => {
    showLoader();
    try {
      const response = await fetch(
        `${API_URL}/api/users?page=${page}&limit=${pagination.limit}`
      );
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
        fetchUsers(pagination.currentPage);
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      showLoader();
      try {
        await fetch(`${API_URL}/api/users/${id}`, {
          method: "DELETE",
        });
        fetchUsers(pagination.currentPage);
      } catch (error) {
        console.error("Error deleting user:", error);
      } finally {
        hideLoader();
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Shield className="w-5 h-5" />
            Manage Roles
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
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
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-red-600 transition-colors"
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
        title={editingId ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password{" "}
              {editingId && (
                <span className="text-gray-400 font-normal text-xs">
                  (leave blank to keep current)
                </span>
              )}
            </label>
            <input
              type="password"
              required={!editingId}
              placeholder={editingId ? "********" : "Enter password"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white capitalize"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role.replace("_", " ")}
                </option>
              ))}
            </select>
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
              {editingId ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      <RoleManagementModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </div>
  );
};

export default Users;
