import { useState, useEffect } from 'react';
import { categoriesAPI, productsAPI } from '../../services/api';
import { FolderTree, Plus, Edit, Trash2, Search, Save, X, AlertCircle, CheckCircle, Package } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null,
  });

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesAPI.getAll();
      const categoriesList = Array.isArray(data) ? data : (data.categories || []);
      setCategories(categoriesList);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll();
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const categoryData = {
        name: formData.name,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id || editingCategory.category_id, categoryData);
        setSuccess('Category updated successfully!');
      } else {
        await categoriesAPI.create(categoryData);
        setSuccess('Category created successfully!');
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', parent_id: null });
      loadCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      parent_id: category.parent_id || null,
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    try {
      // Check if category has associated products
      const categoryProducts = products.filter(p => {
        const pCategoryId = p.category_id || p.category?.id;
        return pCategoryId === categoryId || 
               pCategoryId?.toString() === categoryId?.toString() ||
               p.category?.id === categoryId ||
               p.category?.id?.toString() === categoryId?.toString();
      });

      if (categoryProducts.length > 0) {
        setError(`Cannot delete category. It has ${categoryProducts.length} associated product(s). Please reassign or remove products first.`);
        setShowDeleteConfirm(null);
        return;
      }

      // Check if category has child categories
      const childCategories = categories.filter(
        c => c.parent_id === categoryId || c.parent_id?.toString() === categoryId?.toString()
      );

      if (childCategories.length > 0) {
        setError(`Cannot delete category. It has ${childCategories.length} child categor(ies). Please delete or reassign child categories first.`);
        setShowDeleteConfirm(null);
        return;
      }

      await categoriesAPI.delete(categoryId);
      setSuccess('Category deleted successfully!');
      setShowDeleteConfirm(null);
      loadCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      setShowDeleteConfirm(null);
    }
  };

  const getCategoryHierarchy = () => {
    const categoryMap = new Map();
    categories.forEach(cat => {
      const id = cat.id || cat.category_id;
      categoryMap.set(id, {
        ...cat,
        id,
        children: [],
        productCount: products.filter(p => {
          const pCategoryId = p.category_id || p.category?.id;
          return pCategoryId === id || 
                 pCategoryId?.toString() === id?.toString() ||
                 p.category?.id === id ||
                 p.category?.id?.toString() === id?.toString();
        }).length,
      });
    });

    const rootCategories = [];
    categoryMap.forEach((cat, id) => {
      const parentId = cat.parent_id;
      if (parentId && categoryMap.has(parentId)) {
        categoryMap.get(parentId).children.push(cat);
      } else {
        rootCategories.push(cat);
      }
    });

    return rootCategories;
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return null;
    const category = categories.find(c => (c.id || c.category_id) === categoryId);
    return category?.name || 'Unknown';
  };

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.id?.toString().includes(searchTerm) ||
    category.category_id?.toString().includes(searchTerm)
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
          <p className="text-gray-600 mt-1">Organize your products into categories</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', description: '', parent_id: null });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => {
            const categoryId = category.id || category.category_id;
            // Products can have category_id directly or nested category object
            const productCount = products.filter(p => {
              const pCategoryId = p.category_id || p.category?.id || p.category_id;
              return pCategoryId === categoryId || 
                     pCategoryId?.toString() === categoryId?.toString() ||
                     p.category?.id === categoryId ||
                     p.category?.id?.toString() === categoryId?.toString();
            }).length;
            const childCount = categories.filter(
              c => c.parent_id === categoryId || c.parent_id?.toString() === categoryId?.toString()
            ).length;

            return (
              <div
                key={categoryId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FolderTree className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name || 'Unnamed Category'}</h3>
                      <p className="text-xs text-gray-500">ID: {categoryId}</p>
                    </div>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                )}
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Package className="w-4 h-4" />
                    <span>{productCount} product(s)</span>
                  </div>
                  {category.parent_id && (
                    <div className="text-xs text-gray-500">
                      Parent: {getCategoryName(category.parent_id)}
                    </div>
                  )}
                  {childCount > 0 && (
                    <div className="text-xs text-blue-600">
                      {childCount} child categor(ies)
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(categoryId)}
                    className="px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No categories found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCategory(null);
                  setFormData({ name: '', description: '', parent_id: null });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Category (Optional)</label>
                <select
                  name="parent_id"
                  value={formData.parent_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (Root Category)</option>
                  {categories
                    .filter(cat => {
                      const id = cat.id || cat.category_id;
                      return !editingCategory || id !== (editingCategory.id || editingCategory.category_id);
                    })
                    .map((cat) => (
                      <option key={cat.id || cat.category_id} value={cat.id || cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent category to create a hierarchy
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '', parent_id: null });
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
                  <span>{editingCategory ? 'Update' : 'Create'} Category</span>
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
              Are you sure you want to delete this category? This action cannot be undone.
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

export default Categories;
