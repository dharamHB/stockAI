import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { getRolePermissions, fetchRolePermissions } from "../utils/permissions";
import { Plus, Trash2, Save, ShieldCheck, X } from "lucide-react";
import API_URL from "../config";

const RoleManagementModal = ({ isOpen, onClose }) => {
  const [permissions, setPermissions] = useState({});
  const [availableModules, setAvailableModules] = useState([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [isAddingRole, setIsAddingRole] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      await fetchRolePermissions();
      setPermissions(getRolePermissions());

      const token = localStorage.getItem("token");
      const resp = await fetch(`${API_URL}/api/roles/modules`, {
        headers: { "x-auth-token": token },
      });
      if (resp.ok) {
        const modules = await resp.json();
        setAvailableModules(modules);
      }
    } catch (err) {
      toast.error("Failed to load roles and modules");
    }
  };

  const handleTogglePermission = (role, module) => {
    setPermissions((prev) => {
      const currentModules = prev[role] || [];
      const updatedModules = currentModules.includes(module)
        ? currentModules.filter((m) => m !== module)
        : [...currentModules, module];

      return { ...prev, [role]: updatedModules };
    });
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const roleSlug = newRoleName.toLowerCase().trim().replace(/\s+/g, "_");

    if (permissions[roleSlug]) {
      toast.error("Role already exists!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ name: newRoleName, slug: roleSlug }),
      });

      if (response.ok) {
        setPermissions((prev) => ({
          ...prev,
          [roleSlug]: [],
        }));
        setNewRoleName("");
        setIsAddingRole(false);
        toast.success("Role created successfully");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create role");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  const handleDeleteRole = async (role) => {
    if (role === "admin" || role === "super_admin") {
      toast.error(`Cannot delete ${role.replace("_", " ")} role!`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete role '${role}'?`)) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/roles/${role}`, {
          method: "DELETE",
          headers: { "x-auth-token": token },
        });

        if (response.ok) {
          setPermissions((prev) => {
            const next = { ...prev };
            delete next[role];
            return next;
          });
          toast.success(`Role '${role}' deleted.`);
        } else {
          toast.error("Failed to delete role");
        }
      } catch (err) {
        toast.error("Server error");
      }
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/roles/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        await fetchRolePermissions(); // Refresh local permissions
        toast.success("Role permissions updated successfully!");
        onClose();
      } else {
        toast.error("Failed to update permissions");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Security Protocol Configuration"
      maxWidth="max-w-6xl"
    >
      <div className="space-y-8">
        <div className="bg-gray-50/50 dark:bg-neutral-900/30 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/50 dark:bg-neutral-800/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800">
                    Clearance Level
                  </th>
                  {availableModules.map((module) => (
                    <th
                      key={module}
                      className="px-4 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800 text-center"
                    >
                      {module}
                    </th>
                  ))}
                  <th className="px-8 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest italic border-b border-gray-100 dark:border-neutral-800 text-right">
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {Object.keys(permissions).map((role) => (
                  <tr
                    key={role}
                    className="hover:bg-white dark:hover:bg-neutral-800/30 transition-all group"
                  >
                    <td className="px-8 py-5">
                      <span className="font-black text-gray-900 dark:text-gray-100 italic uppercase tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {role.replace("_", " ")}
                      </span>
                    </td>
                    {availableModules.map((module) => (
                      <td key={module} className="px-4 py-5 text-center">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={(permissions[role] || []).includes(module)}
                            onChange={() =>
                              handleTogglePermission(role, module)
                            }
                            className="w-5 h-5 rounded-lg border-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={
                              (role === "admin" && module === "Users") ||
                              role === "super_admin"
                            }
                          />
                        </div>
                      </td>
                    ))}
                    <td className="px-8 py-5 text-right">
                      {role !== "admin" && role !== "super_admin" ? (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                          title="Purge Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest italic px-2">
                          Core Protected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100 dark:border-neutral-800">
          <div className="w-full md:w-auto">
            {isAddingRole ? (
              <form
                onSubmit={handleAddRole}
                className="flex items-center gap-3 animate-in slide-in-from-left-2"
              >
                <input
                  type="text"
                  placeholder="DESIGNATION NAME..."
                  className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all w-48"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-green-700 shadow-lg shadow-green-500/10"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingRole(false)}
                  className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingRole(true)}
                className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all font-black uppercase tracking-widest text-[10px]"
              >
                <Plus className="w-4 h-4 text-primary-500" />
                Initialize New Level
              </button>
            )}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={onClose}
              className="flex-1 md:flex-none px-8 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Abort
            </button>
            <button
              onClick={handleSave}
              className="flex-1 md:flex-none px-10 py-3 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              Commit Configuration
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RoleManagementModal;
