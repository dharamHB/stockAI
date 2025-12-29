import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { hasPermission } from "../utils/permissions";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const userRole = localStorage.getItem("userRole") || "user";

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      roles: ["admin", "manager", "user"],
    },
    { name: "Users", path: "/users", icon: Users, roles: ["admin"] },
    {
      name: "Products",
      path: "/products",
      icon: Package,
      roles: ["admin", "manager"],
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: BarChart3,
      roles: ["admin", "manager"],
    },
    {
      name: "Sales",
      path: "/sales",
      icon: ShoppingCart,
      roles: ["admin", "manager"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["admin", "manager", "user"],
    },
  ];

  const [permissionsKey, setPermissionsKey] = React.useState(0);

  React.useEffect(() => {
    const handleUpdate = () => setPermissionsKey((prev) => prev + 1);
    window.addEventListener("rolePermissionsUpdated", handleUpdate);
    return () =>
      window.removeEventListener("rolePermissionsUpdated", handleUpdate);
  }, []);

  const filteredNavItems = navItems.filter((item) =>
    hasPermission(userRole, item.name)
  );

  return (
    <div
      className={clsx(
        "bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 transition-all duration-300 z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-between p-6 border-b border-gray-200",
          isCollapsed && "px-4"
        )}
      >
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2 truncate whitespace-nowrap">
            <TrendingUp className="w-8 h-8 flex-shrink-0" />
            StockAI
          </h1>
        )}
        {isCollapsed && (
          <TrendingUp className="w-8 h-8 text-primary-600 mx-auto" />
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            "p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200",
            !isCollapsed ? "ml-2" : "hidden"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.name : ""}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed && "justify-center px-0"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {!isCollapsed && (
        <button
          onClick={() => setIsCollapsed(true)}
          className="mx-4 mb-2 p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-2 text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          Minimize
        </button>
      )}

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="mx-auto mb-2 p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div className="p-4 border-t border-gray-200">
        <div
          className={clsx(
            "flex items-center gap-3 mb-4",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-700 font-bold">
            {localStorage.getItem("userName")?.substring(0, 2).toUpperCase() ||
              "US"}
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">
                {localStorage.getItem("userName") || "User"}
              </p>
              <p className="text-xs text-capitalize text-gray-500 truncate">
                {localStorage.getItem("userRole") || "Guest"}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userName");
            window.location.href = "/login";
          }}
          title={isCollapsed ? "Logout" : ""}
          className={clsx(
            "flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
