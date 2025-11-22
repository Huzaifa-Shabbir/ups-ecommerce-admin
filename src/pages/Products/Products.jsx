import { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { Package, Plus, Edit, Trash2, Search, Filter, CheckSquare, Square, X, Save, AlertCircle, CheckCircle } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkEnableModal, setShowBulkEnableModal] = useState(false);
  const [bulkEnableQty, setBulkEnableQty] = useState('1');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [formData, setFormData] = useState({
  name: '',
  price: '',
  description: '',
  category_id: '',
  stock: 0,
  image: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const getQuantity = (product) => {
    // backend may return Quantity (capital Q), or stock/stock_quantity — try common keys
    const q = product?.Quantity ?? product?.quantity ?? product?.stock ?? product?.stock_quantity ?? null;
    // If it's a string numeric, try to parse
    if (typeof q === 'string' && q.trim() !== '') {
      const n = parseInt(q, 10);
      return Number.isNaN(n) ? null : n;
    }
    return (typeof q === 'number') ? q : q;
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      const categoriesList = Array.isArray(data) ? data : (data.categories || []);
      setCategories(categoriesList);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateProductForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.toString().trim()) errors.name = 'Product name is required';
    const priceVal = parseFloat(formData.price);
    if (Number.isNaN(priceVal) || priceVal < 0) errors.price = 'Price must be a non-negative number';
    const stockVal = formData.stock === '' ? NaN : Number(formData.stock);
    if (!Number.isInteger(stockVal) || stockVal < 0) errors.stock = 'Quantity must be an integer >= 0';
    // optional: validate category_id is integer if provided
    if (formData.category_id && isNaN(Number(formData.category_id))) errors.category_id = 'Invalid category';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      // Validate on client to avoid sending bad data to backend
      if (!validateProductForm()) {
        setError('Please fix validation errors before submitting');
        return;
      }

      // Prepare stock value. Note: some backend code treats 0 as falsy when mapping to RPC params
      // (e.g. `stock || null`), so to ensure an explicit zero is sent during updates, send it as
      // the string '0' which is truthy. For creation, numeric 0 is fine.
      const rawStock = typeof formData.stock !== 'undefined' && formData.stock !== '' ? Number(formData.stock) : 0;
      const stockPayload = editingProduct
        ? (rawStock === 0 ? '0' : rawStock) // send '0' for updates when zero
        : rawStock; // for creation send numeric

      const productData = {
  name: formData.name,
  price: parseFloat(formData.price),
  description: formData.description,
  category_id: formData.category_id || null,
  stock: stockPayload,
  image: formData.image || null,
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productData);
        setSuccess('Product updated successfully!');
      } else {
        await productsAPI.create(productData);
        setSuccess('Product created successfully!');
      }

      setShowModal(false);
      setEditingProduct(null);
  setFormData({ name: '', price: '', description: '', category_id: '', stock: 0 });
  setFormData({ name: '', price: '', description: '', category_id: '', stock: 0, image: '' });
            setFormErrors({});
      setFormErrors({});
      
      loadProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      category_id: product.category_id ?? product.category?.id ?? '',
      stock: getQuantity(product) ?? 0,
      image: product.image || '',
    });
    setShowModal(true);
    setFormErrors({});
  };

  const handleDelete = async (productId) => {
    try {
      await productsAPI.delete(productId);
      setSuccess('Product deleted successfully!');
      setShowDeleteConfirm(null);
      loadProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      if (action === 'enable') {
        // enable = set stock to 1; include required fields (name, price) because backend update requires them
        await Promise.all(
          selectedProducts.map(id => {
            const p = products.find(x => x.id === id) || {};
            return productsAPI.update(id, { name: p.name || 'Unnamed', price: p.price || 0, stock: 1 });
          })
        );
        setSuccess(`${selectedProducts.length} product(s) enabled successfully!`);
      } else if (action === 'disable') {
        // disable = set stock to 0; include name & price
        await Promise.all(
          selectedProducts.map(id => {
            const p = products.find(x => x.id === id) || {};
            return productsAPI.update(id, { name: p.name || 'Unnamed', price: p.price || 0, stock: 0 });
          })
        );
        setSuccess(`${selectedProducts.length} product(s) disabled successfully!`);
      } else if (action === 'delete') {
        await Promise.all(selectedProducts.map(id => productsAPI.delete(id)));
        setSuccess(`${selectedProducts.length} product(s) deleted successfully!`);
      }

      setSelectedProducts([]);
      loadProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Bulk action failed');
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await Promise.all(selectedProducts.map(id => productsAPI.delete(id)));
      setSuccess(`${selectedProducts.length} product(s) deleted successfully!`);
      setSelectedProducts([]);
      setShowBulkDeleteConfirm(false);
      loadProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Bulk delete failed');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleApplyBulkEnable = async () => {
    // bulkEnableQty should be an integer >= 0
    const q = parseInt(bulkEnableQty, 10);
    if (Number.isNaN(q) || q < 0) {
      setError('Please enter a valid non-negative quantity');
      return;
    }
    setIsProcessingBulk(true);
    try {
      await Promise.all(selectedProducts.map(id => {
        const p = products.find(x => x.id === id) || {};
        // backend requires name & price on update
        const stockPayload = q === 0 ? '0' : q;
        return productsAPI.update(id, { name: p.name || 'Unnamed', price: p.price || 0, stock: stockPayload });
      }));
      setSuccess(`${selectedProducts.length} product(s) updated with quantity ${q}`);
      setSelectedProducts([]);
      setShowBulkEnableModal(false);
      loadProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Bulk update failed');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const getCategoryName = (categoryId) => {
    // categories list likely contains objects with `id` and `name`.
    const category = categories.find(c => c.id === categoryId || c.category_id === categoryId || c.id === (categoryId?.id) );
    return category?.name || (typeof categoryId === 'object' ? categoryId?.name : 'Uncategorized');
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id?.toString().includes(searchTerm);
    
    const qtyVal = getQuantity(product);
    const isAvailable = qtyVal !== null ? (qtyVal > 0) : (product.is_available !== false);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && isAvailable) ||
      (statusFilter === 'unavailable' && !isAvailable);
    
    const prodCategoryId = product.category?.id ?? product.category_id ?? product.category_id;
    const matchesCategory = 
      categoryFilter === 'all' ||
      prodCategoryId?.toString() === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
          <p className="text-gray-600 mt-1">View and manage all products in your store</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: '', description: '', category_id: '', stock: 0 });
            setFormErrors({});
            setFormErrors({});
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
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

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products by name, description, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id || cat.category_id} value={cat.id || cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-900 font-medium">
            {selectedProducts.length} product(s) selected
          </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setBulkEnableQty('1'); setError(null); setShowBulkEnableModal(true); }}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                Enable (set quantity)
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Delete
              </button>
            </div>
        </div>
      )}

      {/* Products Table */}
      {/* Products Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="object-contain h-40 w-full" />
                ) : (
                  <Package className="w-16 h-16 text-gray-300" />
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg text-gray-900">{product.name || 'Unnamed Product'}</span>
                  <span className="text-sm font-semibold text-blue-600">${parseFloat(product.price || 0).toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{product.description?.substring(0, 60) || 'No description'}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-700">Qty: {getQuantity(product) ?? 'N/A'}</span>
                  <span className="text-xs text-gray-700">{getCategoryName(product.category ?? product.category_id)}</span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQuantity(product) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {getQuantity(product) > 0 ? 'Available' : 'Unavailable'}
                </span>
                <div className="flex items-center justify-end space-x-2 mt-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 col-span-full">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                          setShowModal(false);
                          setEditingProduct(null);
                          setFormData({ name: '', price: '', description: '', category_id: '', stock: 0 });
                          setFormErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.name ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Enter product name"
                />
                {formErrors.name && <p className="mt-2 text-sm text-red-600">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.price ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="0.00"
                />
                {formErrors.price && <p className="mt-2 text-sm text-red-600">{formErrors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.stock ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="0"
                />
                {formErrors.stock && <p className="mt-2 text-sm text-red-600">{formErrors.stock}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.category_id ? 'border-red-500' : 'border-gray-200'}`}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id || cat.category_id} value={cat.id || cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Availability is derived from Quantity (stock) — do not send is_available to backend */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    setFormData({ name: '', price: '', description: '', category_id: '', stock: 0 });
                    setFormErrors({});
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProduct ? 'Update' : 'Create'} Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
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
      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete {selectedProducts.length} item(s)</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete the selected products? This action cannot be undone.</p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={isProcessingBulk}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60"
              >
                {isProcessingBulk ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Enable (set quantity) Modal */}
      {showBulkEnableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Set Quantity for {selectedProducts.length} item(s)</h3>
            <p className="text-gray-600 mb-4">Enter the quantity to set for the selected products.</p>
            <div className="mb-4">
              <input
                type="number"
                min="0"
                value={bulkEnableQty}
                onChange={(e) => setBulkEnableQty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowBulkEnableModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkEnable}
                disabled={isProcessingBulk}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
              >
                {isProcessingBulk ? 'Updating...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
