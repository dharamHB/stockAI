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
import { LoadingProvider } from "./context/LoadingContext";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleRoute = ({ children, roles }) => {
  const userRole = localStorage.getItem("userRole");
  if (!roles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <LoadingProvider>
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
                <RoleRoute roles={["admin"]}>
                  <Users />
                </RoleRoute>
              }
            />
            <Route
              path="products"
              element={
                <RoleRoute roles={["admin", "manager"]}>
                  <Products />
                </RoleRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <RoleRoute roles={["admin", "manager"]}>
                  <Inventory />
                </RoleRoute>
              }
            />
            <Route
              path="sales"
              element={
                <RoleRoute roles={["admin", "manager"]}>
                  <Sales />
                </RoleRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </LoadingProvider>
  );
}

export default App;
