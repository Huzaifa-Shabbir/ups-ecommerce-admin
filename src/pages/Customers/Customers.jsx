import { useState, useEffect } from 'react';
import { ordersAPI, customersAPI } from '../../services/api';
import { Users, Search, Eye, Download, Calendar, Mail, Phone, ShoppingCart, DollarSign, X, AlertCircle, Trash } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);

  // Add the same date parsing logic from Orders page
  const getOrderDate = (order) => {
    const dateVal = order?.order_date || order?.created_at || order?.order?.order_date || order?.orderDetail?.order?.order_date || order?.orderDetail?.order_date;
    if (!dateVal) return null;
    try {
      return new Date(dateVal);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    loadCustomers(customerFilter);
  }, []);

  const loadCustomers = async (filter = 'all') => {
    try {
      setLoading(true);
      setError(null);
      let data = [];
      if (filter === 'active') {
        data = await customersAPI.getActive();
      } else {
        data = await customersAPI.getAll();
      }
      // Normalize customers array shape
      const customersList = Array.isArray(data) ? data : (data.customers || []);

      // Also fetch orders to compute per-customer totals (frontend-only aggregation)
      let ordersList = [];
      try {
        const ordersData = await ordersAPI.getAll();
        ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
      } catch (e) {
        console.warn('Failed to fetch orders for customer totals:', e.message || e);
        ordersList = [];
      }

      // Build totals map by customer id
      const totalsMap = new Map();
      ordersList.forEach((o) => {
        const cid = o.customer_id || o.user_id || o.user_Id || o.customer_Id;
        if (!cid) return;
        const key = cid.toString();
        const prev = totalsMap.get(key) || { totalOrders: 0, totalSpent: 0 };
        prev.totalOrders += 1;
        prev.totalSpent += parseFloat(o.total_amount || o.amount || 0) || 0;
        totalsMap.set(key, prev);
      });

      // Map to expected UI shape and apply totals from orders
      const mapped = customersList.map((c) => {
        const cid = (c.user_Id || c.id || c.user_id || '').toString();
        const totals = totalsMap.get(cid) || { totalOrders: 0, totalSpent: 0 };
        return {
          id: c.user_Id || c.id || c.user_id,
          username: c.username || c.name || c.full_name || c.userName || c.name,
          email: c.email || c.customer_email || 'N/A',
          registrationDate: c.created_at || c.registrationDate || null,
          is_active: c.is_active === undefined ? true : !!c.is_active,
          totalOrders: totals.totalOrders,
          totalSpent: totals.totalSpent,
          raw: c,
        };
      });

      setCustomers(mapped);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetails = async (customerId) => {
    try {
      setLoading(true);
      // Fetch customer full record (active endpoint)
      const cust = await customersAPI.getById(customerId);
      const customer = {
        id: cust.user_Id || cust.id || cust.user_id,
        username: cust.username || cust.name || cust.full_name || cust.userName,
        email: cust.email,
        registrationDate: cust.created_at || null,
        is_active: cust.is_active === undefined ? true : !!cust.is_active,
        raw: cust,
      };

      // Fetch customer orders separately
      let orders = [];
      try {
        orders = await ordersAPI.getCustomerOrders(customer.id);
      } catch (e) {
        console.warn('Failed to fetch customer orders:', e.message || e);
        orders = [];
      }

      const ordersList = Array.isArray(orders) ? orders : (orders.orders || []);
      
      // Compute totals for selected customer
      const totalOrders = ordersList.length;
      const totalSpent = ordersList.reduce((sum, o) => sum + (parseFloat(o.total_amount || o.amount || 0) || 0), 0);

      const customerWithTotals = { ...customer, totalOrders, totalSpent };

      setSelectedCustomer(customerWithTotals);
      setCustomerOrders(ordersList);
      setShowDetails(true);
      setError(null);
    } catch (err) {
      setError('Failed to load customer details: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateCustomer = async (customerId) => {
    try {
      setLoading(true);
      await customersAPI.deactivate(customerId);
      // Refresh list and close modal
      await loadCustomers();
      setShowDetails(false);
      setSelectedCustomer(null);
      setCustomerOrders([]);
      setError(null);
    } catch (err) {
      setError('Failed to deactivate customer: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  const exportCustomerData = () => {
    const csvContent = [
      ['User ID', 'Username', 'Email', 'Registration Date', 'Total Orders', 'Total Spent'].join(','),
      ...customers.map(c => [
        c.id,
        c.username,
        c.email,
        c.registrationDate ? new Date(c.registrationDate).toLocaleDateString() : 'N/A',
        c.totalOrders || 0,
        (c.totalSpent || 0).toFixed(2),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id?.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Customers</h1>
          <p className="text-gray-600 mt-1">View and manage your customer base</p>
        </div>
        <button
          onClick={exportCustomerData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Export Data</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Search Bar & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={customerFilter}
            onChange={(e) => { setCustomerFilter(e.target.value); loadCustomers(e.target.value); }}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Customers</option>
            <option value="active">Active Customers</option>
          </select>
          <button
            onClick={() => loadCustomers(customerFilter)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredCustomers.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">User ID</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Username</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Registration Date</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Total Orders</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Total Spent</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-4 px-6 text-gray-600">#{customer.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{customer.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {customer.registrationDate
                      ? new Date(customer.registrationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </td>
                  <td className="py-4 px-6 text-gray-900 font-semibold">{customer.totalOrders}</td>
                  <td className="py-4 px-6 text-gray-900 font-semibold">
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        loadCustomerDetails(customer.id);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 ml-auto"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No customers found</p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedCustomer(null);
                  setCustomerOrders([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Customer Information</span>
                  </h3>
                  <p className="text-gray-900 font-semibold">{selectedCustomer.username}</p>
                  <p className="text-sm text-gray-600">ID: #{selectedCustomer.id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </h3>
                  <p className="text-gray-900">{selectedCustomer.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Registration Date</span>
                  </h3>
                  <p className="text-gray-900">
                    {selectedCustomer.registrationDate
                      ? new Date(selectedCustomer.registrationDate).toLocaleDateString('en-US')
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Total Orders</span>
                  </h3>
                  <p className="text-gray-900 font-bold text-lg">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Total Spent</span>
                  </h3>
                  <p className="text-gray-900 font-bold text-2xl">
                    ${selectedCustomer.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Order History ({customerOrders.length})</span>
                </h3>
                {customerOrders.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((order) => (
                          <tr key={order.id || order.order_id} className="border-b border-gray-100">
                            <td className="py-3 px-4">#{order.id || order.order_id}</td>
                            <td className="py-3 px-4">
                              {(() => {
                                const orderDate = getOrderDate(order);
                                return orderDate 
                                  ? orderDate.toLocaleDateString('en-US')
                                  : 'N/A';
                              })()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  order.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.status || 'pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              ${parseFloat(order.total_amount || order.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No orders found</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDeactivateCustomer(selectedCustomer.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                >
                  <Trash className="w-4 h-4" />
                  <span>Deactivate Customer</span>
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedCustomer(null);
                    setCustomerOrders([]);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;