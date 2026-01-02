import API_URL from "../config";

export const AVAILABLE_MODULES = [
  "Dashboard",
  "Users",
  "Products",
  "Inventory",
  "Sales",
  "Cart",
  "My Orders",
  "Settings",
];

let rolePermissions = {};

export const fetchRolePermissions = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/roles`, {
      headers: {
        "x-auth-token": token,
      },
    });
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === "object" && !Array.isArray(data)) {
        rolePermissions = data;
        localStorage.setItem("role_permissions", JSON.stringify(data));
        window.dispatchEvent(new Event("rolePermissionsUpdated"));
      }
    } else {
      console.error("Failed to fetch permissions:", response.status);
    }
  } catch (err) {
    console.error("Failed to fetch role permissions:", err);
  }
};

export const getRolePermissions = () => {
  if (Object.keys(rolePermissions).length === 0) {
    const stored = localStorage.getItem("role_permissions");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          rolePermissions = parsed;
        }
      } catch (e) {
        console.error("Failed to parse stored permissions:", e);
        localStorage.removeItem("role_permissions");
      }
    }
  }
  return rolePermissions;
};

export const hasPermission = (userRole, moduleName) => {
  if (userRole === "super_admin") return true;
  if (userRole === "admin" && moduleName === "Notifications") return true;
  const permissions = getRolePermissions();
  const roleModules = permissions[userRole] || [];
  return roleModules.includes(moduleName);
};

export const getAvailableRoles = () => {
  return Object.keys(getRolePermissions());
};

export const setRolePermissions = (role, modules) => {
  if (!role || !modules) return;
  const current = getRolePermissions();
  const updated = { ...current, [role]: modules };
  rolePermissions = updated;
  localStorage.setItem("role_permissions", JSON.stringify(updated));
  window.dispatchEvent(new Event("rolePermissionsUpdated"));
};
