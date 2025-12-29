export const DEFAULT_PERMISSIONS = {
  admin: ["Dashboard", "Users", "Products", "Inventory", "Sales", "Settings"],
  manager: ["Dashboard", "Products", "Inventory", "Sales"],
  user: ["Dashboard", "Settings"],
};

export const AVAILABLE_MODULES = [
  "Dashboard",
  "Users",
  "Products",
  "Inventory",
  "Sales",
  "Settings",
];

export const getRolePermissions = () => {
  const stored = localStorage.getItem("role_permissions");
  if (stored) {
    return JSON.parse(stored);
  }
  return DEFAULT_PERMISSIONS;
};

export const saveRolePermissions = (permissions) => {
  localStorage.setItem("role_permissions", JSON.stringify(permissions));
  window.dispatchEvent(new Event("rolePermissionsUpdated"));
};

export const getAvailableRoles = () => {
  return Object.keys(getRolePermissions());
};

export const hasPermission = (userRole, moduleName) => {
  if (userRole === "super_admin") return true; // Hardcode super_admin override if needed
  const permissions = getRolePermissions();
  const roleModules = permissions[userRole] || [];
  return roleModules.includes(moduleName);
};
