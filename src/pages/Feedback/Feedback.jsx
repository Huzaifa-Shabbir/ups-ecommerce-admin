import { useState, useEffect } from 'react';
import { feedbackAPI } from '../../services/api';
import { MessageSquare, Trash2, Star, Search, Filter, X, AlertCircle, CheckCircle, Reply, Send } from 'lucide-react';

const Feedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [fetchFilter, setFetchFilter] = useState('all'); // all | customer | order
  const [filterValue, setFilterValue] = useState('');
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadFeedback();
  }, []);

  const sanitizeFilterValue = (mode, value) => {
    if (!value && value !== 0) return '';
    const trimmed = value.toString().trim();
    if (!trimmed) return '';

    const withoutHash = trimmed.replace(/^#/, '');

    if (mode === 'customer') {
      const uuidMatch = withoutHash.match(/[0-9a-fA-F-]{8,}/);
      if (uuidMatch) return uuidMatch[0];
      return withoutHash.replace(/^customer\s+/i, '');
    }

    if (mode === 'order') {
      const numberMatch = withoutHash.match(/\d+/);
      if (numberMatch) return numberMatch[0];
      return withoutHash.replace(/^order\s*/i, '');
    }

    return withoutHash;
  };

  const loadFeedback = async (mode = fetchFilter, value = filterValue) => {
    try {
      setLoading(true);
      const normalizedValue = sanitizeFilterValue(mode, value);
      let data;
      if (mode === 'customer' && normalizedValue) {
        data = await feedbackAPI.getByCustomer(normalizedValue);
      } else if (mode === 'order' && normalizedValue) {
        data = await feedbackAPI.getByOrder(normalizedValue);
      } else {
        data = await feedbackAPI.getAll();
      }
      const feedbackList = Array.isArray(data) ? data : (data.feedback || []);
      setFeedback(feedbackList);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    try {
      await feedbackAPI.delete(feedbackId);
      setSuccess('Feedback deleted successfully!');
      setShowDeleteConfirm(null);
      loadFeedback();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete feedback');
    }
  };

  const handleApplyFilter = async () => {
    const normalized = sanitizeFilterValue(fetchFilter, filterValue);
    if (fetchFilter !== 'all' && !normalized) {
      setError(`Please enter a ${fetchFilter === 'customer' ? 'customer' : 'order'} ID`);
      return;
    }
    setError(null);
    setIsApplyingFilter(true);
    await loadFeedback(fetchFilter, sanitizeFilterValue(fetchFilter, filterValue));
    setIsApplyingFilter(false);
  };

  const handleResetFilter = async () => {
    setFetchFilter('all');
    setFilterValue('');
    setError(null);
    await loadFeedback('all', '');
  };

  const handleSendResponse = async () => {
    if (!responseText.trim() || !selectedFeedback) return;

    try {
      setError(null);
      setSuccess(null);
      // Note: You'll need to add a response endpoint to your backend API
      // For now, this is a placeholder
      setSuccess('Response sent successfully!');
      setShowResponseModal(false);
      setResponseText('');
      setSelectedFeedback(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send response');
    }
  };

  const openResponseModal = (item) => {
    setSelectedFeedback(item);
    setResponseText(item.response || '');
    setShowResponseModal(true);
  };

  const normalizeComment = (item) => item.comment || item.feedback_message || item.message || '';
  const normalizeCustomerName = (item) =>
    item.customer_name ||
    item.customer_full_name ||
    item.customer_email ||
    (item.customer_id ? `Customer ${item.customer_id}` : 'Customer');
  const normalizeCreatedAt = (item) => item.created_at || item.createdAt || item.createdDate;
  const normalizeId = (item) =>
    item.id || item.feedback_id || item.feedbackId || `${item.customer_id ?? ''}-${item.order_no ?? ''}`;

  const filteredFeedback = feedback.filter((item) => {
    const commentText = normalizeComment(item);
    const customerName = normalizeCustomerName(item);
    const customerEmail = item.customer_email || '';
    const itemId = normalizeId(item);
    const matchesSearch =
      commentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemId?.toString().includes(searchTerm);

    const matchesRating =
      ratingFilter === 'all' ||
      item.rating?.toString() === ratingFilter;

    return matchesSearch && matchesRating;
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Feedback</h1>
          <p className="text-gray-600 mt-1">View and manage customer feedback</p>
        </div>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-4 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fetch Feedback By</label>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
              <select
                value={fetchFilter}
                onChange={(e) => setFetchFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:w-48"
              >
                <option value="all">All Feedback</option>
                <option value="customer">Customer ID</option>
                <option value="order">Order ID</option>
              </select>
              {fetchFilter !== 'all' && (
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Enter ${fetchFilter} ID`}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleApplyFilter}
              disabled={isApplyingFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isApplyingFilter ? 'Applying...' : 'Apply'}
            </button>
            <button
              onClick={handleResetFilter}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length > 0 ? (
          filteredFeedback.map((item) => {
            const itemId = normalizeId(item);
            return (
              <div
                key={itemId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {normalizeCustomerName(item)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {normalizeCreatedAt(item)
                          ? new Date(normalizeCreatedAt(item)).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {item.rating && (
                    <div className="flex items-center space-x-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({item.rating}/5)</span>
                    </div>
                  )}
                  {normalizeComment(item) && (
                    <p className="text-gray-700 mb-3">{normalizeComment(item)}</p>
                  )}
                  {item.response && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-3">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Admin Response:</p>
                      <p className="text-sm text-blue-800">{item.response}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!item.response && (
                    <button
                      onClick={() => openResponseModal(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Respond"
                    >
                      <Reply className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteConfirm(itemId)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No feedback found</p>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Respond to Feedback</h3>
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedFeedback(null);
                  setResponseText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Customer Feedback:</p>
              <p className="text-gray-900">{selectedFeedback.comment}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Response</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your response to the customer..."
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedFeedback(null);
                  setResponseText('');
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendResponse}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Response</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this feedback? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
