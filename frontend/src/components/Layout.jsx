import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import clsx from "clsx";

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Mobile Backdrop */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
      />

      <main
        className={clsx(
          "flex-1 p-8 transition-all duration-300",
          // On mobile, if expanded, we keep ml-20 (overlay mode) instead of pushing content
          isCollapsed ? "ml-20" : isMobile ? "ml-20" : "ml-64"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
