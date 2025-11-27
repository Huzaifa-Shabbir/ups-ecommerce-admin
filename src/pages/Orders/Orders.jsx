import { useState, useEffect } from 'react';
import { ordersAPI, productsAPI } from '../../services/api';
import { ShoppingCart, Search, Filter, Eye, X, Save, AlertCircle, CheckCircle, Calendar, User, DollarSign, Package } from 'lucide-react';
import OrdersSummary from '../../components/OrdersSummary/OrdersSummary';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ orderId: null, status: '' });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getAll();
      const ordersList = Array.isArray(data) ? data : (data.orders || []);
      setOrders(ordersList);
      setError(null);
    } catch (err) {
      // Handle database schema errors gracefully
      if (err.message && err.message.includes('customer_id')) {
        setError('Database schema issue: Please check your Supabase stored procedures. The column names may not match.');
      } else {
        setError(err.message);
      }
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getOrderDate = (order) => {
    // backend may return different field names: order_date, created_at, or nested under order/orderDetail
    const dateVal = order?.order_date || order?.created_at || order?.order?.order_date || order?.orderDetail?.order?.order_date || order?.orderDetail?.order_date;
    if (!dateVal) return null;
    try {
      return new Date(dateVal);
    } catch (e) {
      return null;
    }
  };

  const loadOrderDetails = async (orderId) => {
    try {
      // Prefer the "full detail" endpoint which returns richer product/category info
      const data = await ordersAPI.getDetail(orderId).catch(async (err) => {
        // If full detail fails, fall back to basic by-id endpoint
        console.warn('getDetail failed, falling back to getById:', err.message);
        const fallback = await ordersAPI.getById(orderId);
        return fallback;
      });

      // Normalize different possible response shapes from the backend RPCs
      // Possible shapes observed:
      // { order: { items: [...], order: { ... } } }
      // { orderDetail: { items: [...], order: { ... } } }
      // or { items: [...], ...meta }
  let items = data.items || (data.order && data.order.items) || (data.orderDetail && data.orderDetail.items) || [];
      let meta = data.order || data.orderDetail || {};

      // Sometimes the RPC nests order info under 'order.order'
      if (meta.order) meta = meta.order;

      const normalized = {
        ...meta,
        items,
      };

      // Enrich items with product names when missing
      if (items && items.length > 0) {
        const enriched = await Promise.all(items.map(async (it) => {
          const productId = it.product_id || it.productId || it.product_id; // try common variants
          // prefer existing name if present
          if (it.product_name || it.name) return { ...it, product_name: it.product_name || it.name };
          if (!productId) return it;
          try {
            const prod = await productsAPI.getById(productId);
            const name = prod?.name || prod?.product_name || prod?.title || prod?.product || null;
            return { ...it, product_name: name };
          } catch (e) {
            return it;
          }
        }));
        normalized.items = enriched;
      }

      setSelectedOrder(normalized);
      setShowDetails(true);
    } catch (err) {
      // Surface meaningful server error messages when available
      setError('Failed to load order details: ' + (err.message || JSON.stringify(err)));
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.orderId || !statusUpdate.status) return;

    try {
      setError(null);
      setSuccess(null);
      await ordersAPI.updateStatus(statusUpdate.orderId, statusUpdate.status);
      setSuccess('Order status updated successfully!');
      setShowStatusModal(false);
      setStatusUpdate({ orderId: null, status: '' });
      loadOrders();
      if (selectedOrder && selectedOrder.id === statusUpdate.orderId) {
        loadOrderDetails(statusUpdate.orderId);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    }
  };

  const openStatusModal = (order) => {
    setStatusUpdate({ orderId: order.id || order.order_id, status: order.status || 'pending' });
    setShowStatusModal(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const cleaned = (searchTerm || '').toString().trim();

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || (order.status?.toLowerCase() === statusFilter.toLowerCase());

    // If no search term, include by status only
    if (!cleaned) return matchesStatus;

    // If search term looks like a UUID or long alphanumeric id, try exact id matches against order and customer ids
    const looksLikeId = /[0-9a-fA-F]{8,}/.test(cleaned) && (cleaned.includes('-') || cleaned.length >= 8);
    if (looksLikeId) {
      const n = cleaned;
      const idCandidates = [order.id, order.order_id, order.order?.order_id, order.order?.id, order.customer_id, order.user_id];
      const matchesId = idCandidates.some((v) => v && v.toString() === n);
      return matchesId && matchesStatus;
    }

    // If search term is purely numeric, try exact numeric matches against order ids
    if (/^\d+$/.test(cleaned)) {
      const n = cleaned;
      const idCandidates = [order.id, order.order_id, order.order?.order_id, order.order?.id];
      const matchesId = idCandidates.some((v) => v && v.toString() === n);
      return matchesId && matchesStatus;
    }

    // For any other input, only match against customer id/user id substrings (no name matching)
    const idMatch = (order.customer_id || order.user_id || '').toString().toLowerCase().includes(cleaned.toLowerCase());
    return idMatch && matchesStatus;
  });

  // No customer-name lookup: search is restricted to order ID and customer ID only.

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
          <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
          <p className="text-gray-600 mt-1">View and manage customer orders</p>
        </div>
      </div>

      <OrdersSummary />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by order ID or customer id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredOrders.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Customer</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id || order.order_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-4 px-6 text-gray-900 font-semibold">
                    #{order.id || order.order_id}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customer_name || `Customer ${order.customer_id || order.user_id}`}
                        </p>
                        {order.customer_email && (
                          <p className="text-sm text-gray-500">{order.customer_email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {(() => {
                      const d = getOrderDate(order);
                      return d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                    })()}
                  </td>
                  <td className="py-4 px-6 text-gray-900 font-semibold">
                    ${parseFloat(order.total_amount || order.amount || 0).toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => loadOrderDetails(order.id || order.order_id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openStatusModal(order)}
                        className="px-3 py-1 text-sm text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition"
                        title="Update Status"
                      >
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders found</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Order Details #{selectedOrder.id || selectedOrder.order_id}</h2>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Customer Information</span>
                  </h3>
                  <p className="text-gray-900">{selectedOrder.customer_name || `Customer ${selectedOrder.customer_id || selectedOrder.user_id}`}</p>
                  {selectedOrder.customer_email && (
                    <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Order Date</span>
                  </h3>
                  <p className="text-gray-900">
                    {(() => {
                      const d = getOrderDate(selectedOrder);
                      return d ? d.toLocaleString('en-US') : 'N/A';
                    })()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Status</span>
                  </h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}
                  >
                    {selectedOrder.status || 'pending'}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Total Amount</span>
                  </h3>
                  <p className="text-gray-900 font-bold text-lg">
                    ${parseFloat(selectedOrder.total_amount || selectedOrder.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>Order Items</span>
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4">{item.product_name || item.name || 'N/A'}</td>
                            <td className="py-3 px-4">{item.quantity || 1}</td>
                            <td className="py-3 px-4 text-right">${parseFloat(item.price || 0).toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-semibold">
                              ${parseFloat((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openStatusModal(selectedOrder)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Update Status
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedOrder(null);
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

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Order Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusUpdate({ orderId: null, status: '' });
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
