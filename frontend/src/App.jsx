import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";
import AllOrders from "./pages/AllOrders";
import OrderDetails from "./pages/OrderDetails";
import PaymentSuccess from "./pages/PaymentSuccess";
import { LoadingProvider } from "./context/LoadingContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { hasPermission, fetchRolePermissions } from "./utils/permissions";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleRoute = ({ children, moduleName }) => {
  const userRole = localStorage.getItem("userRole");
  if (!hasPermission(userRole, moduleName)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated) {
      fetchRolePermissions();
    }
  }, []);

  return (
    <ThemeProvider>
      <LoadingProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route
                  path="users"
                  element={
                    <RoleRoute moduleName="Users">
                      <Users />
                    </RoleRoute>
                  }
                />
                <Route
                  path="products"
                  element={
                    <RoleRoute moduleName="Products">
                      <Products />
                    </RoleRoute>
                  }
                />
                <Route
                  path="inventory"
                  element={
                    <RoleRoute moduleName="Inventory">
                      <Inventory />
                    </RoleRoute>
                  }
                />
                <Route
                  path="sales"
                  element={
                    <RoleRoute moduleName="Sales">
                      <Sales />
                    </RoleRoute>
                  }
                />
                <Route path="cart" element={<Cart />} />
                <Route
                  path="all-orders"
                  element={
                    <RoleRoute moduleName="All Orders">
                      <AllOrders />
                    </RoleRoute>
                  }
                />
                <Route path="sales/orders/:id" element={<OrderDetails />} />
                <Route path="my-orders" element={<MyOrders />} />
                <Route path="my-orders/:id" element={<OrderDetails />} />
                <Route path="payment-success" element={<PaymentSuccess />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#333",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </CartProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;
