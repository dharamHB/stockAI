export const DEFAULT_PERMISSIONS = {
  super_admin: [
    "Dashboard",
    "Users",
    "Products",
    "Inventory",
    "Sales",
    "Cart",
    "My Orders",
    "Settings",
  ],
  admin: [
    "Dashboard",
    "Users",
    "Products",
    "Inventory",
    "Sales",
    "Cart",
    "My Orders",
    "Settings",
  ],
  manager: ["Dashboard", "Products", "Inventory", "Sales", "Cart", "My Orders"],
  user: ["Dashboard", "Products", "Cart", "My Orders", "Settings"],
};

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

export const getRolePermissions = () => {
  const stored = localStorage.getItem("role_permissions");
  let permissions = DEFAULT_PERMISSIONS;

  if (stored) {
    const parsed = JSON.parse(stored);
    // Merge stored with defaults, ensuring super_admin and admin always have full access
    permissions = {
      ...parsed,
      super_admin: DEFAULT_PERMISSIONS.super_admin,
      admin: DEFAULT_PERMISSIONS.admin,
    };
  }

  return permissions;
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
