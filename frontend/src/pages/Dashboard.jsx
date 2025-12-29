import React, { useEffect, useState } from "react";
import { AlertCircle, TrendingUp, Package, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const mockData = [
  { name: "Mon", demand: 400 },
  { name: "Tue", demand: 300 },
  { name: "Wed", demand: 600 },
  { name: "Thu", demand: 800 },
  { name: "Fri", demand: 500 },
  { name: "Sat", demand: 900 },
  { name: "Sun", demand: 700 },
];

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { showLoader, hideLoader } = useLoading();
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    users: 0,
    lowStock: 0,
  });

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const init = async () => {
      showLoader();
      await Promise.all([fetchStats(), fetchLowStock()]);
      hideLoader();
    };
    init();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await fetch(`${API_URL}/api/inventory`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(
          data.filter((item) => item.quantity <= item.low_stock_threshold)
        );
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Overview of your inventory performance
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${Number(stats.revenue).toFixed(2)}`}
          icon={TrendingUp}
          color="bg-primary-500"
        />
        <StatCard
          title="Total Orders"
          value={stats.orders}
          icon={Package}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Users"
          value={stats.users}
          icon={Users}
          color="bg-orange-500"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Predicted Demand (AI Preview)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ fill: "#0ea5e9", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Stock Alerts
          </h3>
          <div className="space-y-4 max-h-[320px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No stock alerts at the moment.
              </p>
            ) : (
              alerts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-900">
                      {item.product_name}
                    </h4>
                    <p className="text-xs text-red-700 mt-1">
                      {item.quantity} items left (Threshold:{" "}
                      {item.low_stock_threshold})
                    </p>
                  </div>
                  <button
                    onClick={() => (window.location.href = "/inventory")}
                    className="text-xs font-medium text-red-600 hover:text-red-800 bg-white px-2 py-1 rounded shadow-sm"
                  >
                    Restock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
