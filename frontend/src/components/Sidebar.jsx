import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  ShoppingBag,
  ClipboardList,
  BarChart3,
  TrendingUp,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  Bell,
} from "lucide-react";

import clsx from "clsx";
import { hasPermission } from "../utils/permissions";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const userRole = localStorage.getItem("userRole") || "user";
  const { getCartCount, cartItems } = useCart();
  const [cartCount, setCartCount] = useState(0);

  // Update cart count when cartItems change
  useEffect(() => {
    const count = getCartCount();
    setCartCount(count);
  }, [cartItems, getCartCount]);

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin", "manager", "user", "tenant"],
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
      roles: ["super_admin", "admin"],
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      roles: ["super_admin", "admin"],
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
      roles: ["admin", "manager", "user"],
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
      name: "All Orders",
      path: "/all-orders",
      icon: ClipboardList,
      roles: ["admin", "manager"],
    },
    {
      name: "Cart",
      path: "/cart",
      icon: ShoppingBag,
      roles: ["admin", "manager", "user"],
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      name: "My Orders",
      path: "/my-orders",
      icon: ClipboardList,
      roles: ["admin", "manager", "user"],
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

  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={clsx(
        "bg-white dark:bg-black h-screen border-r border-gray-100 dark:border-neutral-900 flex flex-col fixed left-0 top-0 transition-all duration-500 z-50 shadow-xl dark:shadow-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div
        className={clsx(
          "flex items-center p-6 border-b border-gray-50 dark:border-neutral-900/50",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <h1 className="text-xl font-black text-primary-600 dark:text-primary-500 italic flex items-center gap-2 truncate whitespace-nowrap">
            <TrendingUp className="w-8 h-8 flex-shrink-0" />
            StockAI
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
          title={isCollapsed ? "Expand Registry" : "Minimize Registry"}
        >
          <Menu className="w-6 h-6" />
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
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-gray-100",
                isCollapsed && "justify-center px-0"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
            {!isCollapsed && item.badge && (
              <span className="ml-auto bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            {isCollapsed && item.badge && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
        <div
          className={clsx(
            "flex items-center gap-3 mb-4",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex-shrink-0 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">
            {localStorage.getItem("userName")?.substring(0, 2).toUpperCase() ||
              "US"}
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {localStorage.getItem("userName") || "User"}
              </p>
              <p className="text-xs text-capitalize text-gray-500 dark:text-gray-400 truncate">
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
            "flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all duration-200",
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
