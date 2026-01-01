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
  <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 transition-all hover:shadow-md group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 italic">
          {title}
        </p>
        <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic tracking-tighter">
          {value}
        </h3>
      </div>
      <div
        className={`p-3 rounded-xl ${color} shadow-lg transition-transform group-hover:scale-110`}
      >
        <Icon className="w-5 h-5 text-white" />
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
      const response = await fetch(`${API_URL}/api/stats`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });
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
      const response = await fetch(`${API_URL}/api/inventory`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(
          data.items.filter((item) => item.quantity <= item.low_stock_threshold)
        );
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
          Executive Overview
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Analytics dashboard for real-time inventory assets
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181818] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 italic uppercase tracking-tighter">
              Projected Demand Curve{" "}
              <span className="text-[10px] font-black text-primary-500 ml-2 py-0.5 px-2 bg-primary-50 dark:bg-primary-900/10 rounded uppercase tracking-widest">
                AI Preview
              </span>
            </h3>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                  className="dark:stroke-neutral-800"
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "15px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                  cursor={{ stroke: "#10b981", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke="#10b981"
                  strokeWidth={4}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{
                    r: 6,
                    stroke: "#10b981",
                    strokeWidth: 4,
                    fill: "#fff",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-[#181818] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3 italic">
            <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
            Critical Alerts
          </h3>
          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-50">
                <Package className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest text-center">
                  All Systems nominal
                </p>
              </div>
            ) : (
              alerts.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 transition-all hover:bg-red-100/50 dark:hover:bg-red-900/20"
                >
                  <div>
                    <h4 className="text-sm font-black text-red-900 dark:text-red-300 italic">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-500">
                        {item.quantity} Inventory Left
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => (window.location.href = "/inventory")}
                    className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-white bg-red-600 hover:bg-red-700 py-2.5 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
                  >
                    Resolve Status
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
