import { useState, useEffect } from 'react';
import { paymentsAPI } from '../../services/api';
import { CreditCard, Search, Filter, AlertCircle, CheckCircle, XCircle, Trash2, PlusCircle } from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchPaymentId, setSearchPaymentId] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchMethod, setSearchMethod] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ order_id: '', payment_method: '', amount: '' });
  const [createError, setCreateError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentsAPI.getAll();
      setPayments(Array.isArray(data) ? data : (data.payments || []));
      setError(null);
    } catch (err) {
      setError(err.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Search payments by order ID
  const handleOrderIdSearch = async (e) => {
    e.preventDefault();
    if (!orderIdSearch) return;
    setLoading(true);
    setError(null);
    try {
      const data = await paymentsAPI.getByOrder(orderIdSearch);
      setPayments(Array.isArray(data) ? data : (data.payments || []));
      setSearchedOrder(true);
    } catch (err) {
      setError(err.message);
      setPayments([]);
      setSearchedOrder(true);
    } finally {
      setLoading(false);
    }
  };

  // Back to all payments
  const handleBackToAllPayments = () => {
    setOrderIdSearch('');
    setSearchedOrder(false);
    loadPayments();
  };

  // Create payment
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      if (!createData.order_id || !createData.payment_method || !createData.amount) {
        setCreateError('order_id, payment_method, and amount required');
        setCreateLoading(false);
        return;
      }
      await paymentsAPI.create({
        order_id: createData.order_id,
        payment_method: createData.payment_method,
        amount: createData.amount,
      });
      setShowCreate(false);
      setCreateData({ order_id: '', payment_method: '', amount: '' });
      loadPayments();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete payment
  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    setLoading(true);
    setError(null);
    try {
      await paymentsAPI.delete(id);
      // If searching by order, reload that, else reload all
      if (searchedOrder && orderIdSearch) {
        const data = await paymentsAPI.getByOrder(orderIdSearch);
        setPayments(Array.isArray(data) ? data : (data.payments || []));
      } else {
        loadPayments();
      }
    } catch (err) {
      setError('Failed to delete payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesPaymentId = searchPaymentId ? (payment.id?.toString().includes(searchPaymentId) || payment.payment_id?.toString().includes(searchPaymentId)) : true;
    const matchesOrderId = searchOrderId ? payment.order_id?.toString().includes(searchOrderId) : true;
    const matchesMethod = searchMethod ? (payment.payment_method?.toLowerCase().includes(searchMethod.toLowerCase()) || payment.method?.toLowerCase().includes(searchMethod.toLowerCase())) : true;
    return matchesPaymentId && matchesOrderId && matchesMethod;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Manage Payments</h1>
          <p className="text-gray-600 mt-1">View and track all payment transactions</p>
        </div>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => setShowCreate((v) => !v)}
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add Payment</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Separate Search Bars */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Payment ID..."
            value={searchPaymentId}
            onChange={(e) => setSearchPaymentId(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Method..."
            value={searchMethod}
            onChange={(e) => setSearchMethod(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Create Payment Modal */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">Create Payment</h2>
          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Order ID</label>
              <input
                type="number"
                min="1"
                value={createData.order_id}
                onChange={(e) => setCreateData({ ...createData, order_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <input
                type="text"
                value={createData.payment_method}
                onChange={(e) => setCreateData({ ...createData, payment_method: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={createData.amount}
                onChange={(e) => setCreateData({ ...createData, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1"
                required
              />
            </div>
            {createError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>{createError}</span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={createLoading}
              >
                {createLoading ? 'Creating...' : 'Create Payment'}
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                onClick={() => setShowCreate(false)}
              >Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Back to All Payments button after search */}
      {searchedOrder && (
        <div className="mb-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            onClick={handleBackToAllPayments}
          >
            Back to All Payments
          </button>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredPayments.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Payment ID</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Method</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id || payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-4 px-6 text-gray-900 font-semibold">#{payment.id || payment.payment_id}</td>
                  <td className="py-4 px-6 text-gray-600">#{payment.order_id || 'N/A'}</td>
                  <td className="py-4 px-6 text-gray-900 font-semibold">
                    ${parseFloat(payment.amount || 0).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-gray-600 capitalize">
                    {payment.payment_method || payment.method || 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {payment.payment_date || payment.created_at ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-800 font-semibold">Paid</span>
                        </>
                      ) : (
                        <span className="text-yellow-800 font-semibold">Pending</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {payment.payment_date
                      ? new Date(payment.payment_date).toLocaleDateString()
                      : payment.created_at
                        ? new Date(payment.created_at).toLocaleDateString()
                        : 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                      title="Delete Payment"
                      onClick={() => handleDeletePayment(payment.id || payment.payment_id)}
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No payments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;


