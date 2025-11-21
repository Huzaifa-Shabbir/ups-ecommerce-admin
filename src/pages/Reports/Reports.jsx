import { useState, useEffect } from 'react';
import { dashboardAPI, ordersAPI, productsAPI, categoriesAPI } from '../../services/api';
import { BarChart3, TrendingUp, Download, Calendar, AlertCircle, FileText } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import OrdersSummary from '../../components/OrdersSummary/OrdersSummary';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [dashboardData, ordersData, productsData] = await Promise.all([
        dashboardAPI.getStats(),
        ordersAPI.getAll(),
        productsAPI.getAll(),
      ]);

      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
      const productsList = Array.isArray(productsData) ? productsData : (productsData.products || []);

      setStats(dashboardData);
      setOrders(ordersList);
      setProducts(productsList);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportReports = () => {
    const reportData = {
      summary: {
        totalProducts: stats?.totalProducts || 0,
        totalCustomers: stats?.totalCustomers || 0,
        totalOrders: stats?.totalOrders || 0,
        totalRevenue: stats?.totalRevenue || 0,
      },
      orders: {
        completed: orders.filter(o => o.status === 'completed').length,
        pending: orders.filter(o => o.status === 'pending').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
      },
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const csvContent = [
      ['Metric', 'Value'].join(','),
      ['Total Products', stats?.totalProducts || 0].join(','),
      ['Total Customers', stats?.totalCustomers || 0].join(','),
      ['Total Orders', stats?.totalOrders || 0].join(','),
      ['Total Revenue', `$${stats?.totalRevenue || 0}`].join(','),
      ['Completed Orders', orders.filter(o => o.status === 'completed').length].join(','),
      ['Pending Orders', orders.filter(o => o.status === 'pending').length].join(','),
      ['Cancelled Orders', orders.filter(o => o.status === 'cancelled').length].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Prepare chart data
  const orderStatusData = [
    { name: 'Completed', value: orders.filter(o => o.status === 'completed').length },
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ];

  // Monthly revenue data (mock - replace with real data)
  const monthlyRevenue = [
    { name: 'Jan', revenue: 4000, orders: 24 },
    { name: 'Feb', revenue: 3000, orders: 13 },
    { name: 'Mar', revenue: 5000, orders: 28 },
    { name: 'Apr', revenue: 4500, orders: 22 },
    { name: 'May', revenue: 6000, orders: 30 },
    { name: 'Jun', revenue: 5500, orders: 27 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-700">Error loading reports: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your business</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

  {/* Top-level Orders Summary (KPIs) */}
  <OrdersSummary />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(stats?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-900">
              {orders.filter(o => o.status === 'completed').length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-700 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-900">
              {orders.filter(o => o.status === 'pending').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-medium text-red-700 mb-1">Cancelled</p>
            <p className="text-3xl font-bold text-red-900">
              {orders.filter(o => o.status === 'cancelled').length}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Product Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-700 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-blue-900">{products.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700 mb-1">Available Products</p>
            <p className="text-2xl font-bold text-green-900">
              {products.filter(p => p.is_available !== false).length}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Unavailable Products</p>
            <p className="text-2xl font-bold text-gray-900">
              {products.filter(p => p.is_available === false).length}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Average Order Value</p>
            <p className="text-3xl font-bold text-gray-900">
              ${stats?.totalOrders > 0
                ? (stats.totalRevenue / stats.totalOrders).toFixed(2)
                : '0.00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
