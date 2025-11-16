import { useState, useEffect } from 'react';
import { paymentsAPI } from '../../services/api';
import { CreditCard, Search, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      // Handle database schema errors gracefully
      if (err.message && err.message.includes('customer_id')) {
        setError('Database schema issue: Please check your Supabase stored procedures. The column names may not match.');
      } else {
        setError(err.message);
      }
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) =>
    payment.id?.toString().includes(searchTerm) ||
    payment.order_id?.toString().includes(searchTerm) ||
    payment.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Payments</h1>
          <p className="text-gray-600 mt-1">View and track all payment transactions</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">Error loading payments: {error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Filter</span>
        </button>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-4 px-6 text-gray-900 font-semibold">#{payment.id}</td>
                  <td className="py-4 px-6 text-gray-600">#{payment.order_id || 'N/A'}</td>
                  <td className="py-4 px-6 text-gray-900 font-semibold">
                    ${parseFloat(payment.amount || 0).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-gray-600 capitalize">
                    {payment.payment_method || 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {payment.status === 'completed' || payment.status === 'success' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-800 font-semibold">Completed</span>
                        </>
                      ) : payment.status === 'failed' ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-800 font-semibold">Failed</span>
                        </>
                      ) : (
                        <span className="text-yellow-800 font-semibold">Pending</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
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


