import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import {
  getRolePermissions,
  saveRolePermissions,
  AVAILABLE_MODULES,
} from "../utils/permissions";
import { Plus, Trash2, Save } from "lucide-react";

const RoleManagementModal = ({ isOpen, onClose }) => {
  const [permissions, setPermissions] = useState({});
  const [newRoleName, setNewRoleName] = useState("");
  const [isAddingRole, setIsAddingRole] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermissions(getRolePermissions());
    }
  }, [isOpen]);

  const handleTogglePermission = (role, module) => {
    setPermissions((prev) => {
      const currentModules = prev[role] || [];
      const updatedModules = currentModules.includes(module)
        ? currentModules.filter((m) => m !== module)
        : [...currentModules, module];

      return { ...prev, [role]: updatedModules };
    });
  };

  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const roleSlug = newRoleName.toLowerCase().trim().replace(/\s+/g, "_");

    if (permissions[roleSlug]) {
      toast.error("Role already exists!");
      return;
    }

    setPermissions((prev) => ({
      ...prev,
      [roleSlug]: [],
    }));
    setNewRoleName("");
    setIsAddingRole(false);
  };

  const handleDeleteRole = (role) => {
    if (role === "admin" || role === "super_admin") {
      toast.error(`Cannot delete ${role.replace("_", " ")} role!`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete role '${role}'?`)) {
      setPermissions((prev) => {
        const next = { ...prev };
        delete next[role];
        return next;
      });
      toast.success(`Role '${role}' deleted.`);
    }
  };

  const handleSave = () => {
    saveRolePermissions(permissions);
    toast.success("Role permissions updated successfully!");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Role & Permissions Management"
    >
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Role</th>
                {AVAILABLE_MODULES.map((module) => (
                  <th key={module} className="px-4 py-3 text-center">
                    {module}
                  </th>
                ))}
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(permissions).map((role) => (
                <tr key={role} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 capitalize">
                    {role.replace("_", " ")}
                  </td>
                  {AVAILABLE_MODULES.map((module) => (
                    <td key={module} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={(permissions[role] || []).includes(module)}
                        onChange={() => handleTogglePermission(role, module)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        disabled={
                          (role === "admin" && module === "Users") ||
                          role === "super_admin"
                        } // Prevent locking out admin from Users or modifying super_admin
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    {role !== "admin" && role !== "super_admin" && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {isAddingRole ? (
              <form
                onSubmit={handleAddRole}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="New Role Name"
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingRole(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingRole(true)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add New Role
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RoleManagementModal;
