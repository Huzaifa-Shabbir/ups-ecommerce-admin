import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resourcesAPI } from '../../services/api';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const ACCESS_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'customer', label: 'Customers' },
  { value: 'technician', label: 'Technicians' },
  { value: 'all', label: 'Customers & Technicians' },
];

const getAccessLabel = (val) => ACCESS_OPTIONS.find(o => o.value === val)?.label || (val === 'all' ? 'Customers & Technicians' : val);

const emptyForm = {
  title: '',
  description: '',
  file_URL: '',
  access_level: 'all',
};

const getDescriptionValue = (resource = {}) =>
  resource.description ??
  resource.Description ??
  resource.resource_description ??
  resource.details ??
  '';

const Resources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await resourcesAPI.getAll();
      const list = Array.isArray(data) ? data : data.resources || data.data || [];
      setResources(list);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    const description = formData.description?.trim() || '';
    const payload = {
      ...formData,
      uploaded_by: user?.id,
      access_level: formData.access_level || 'all',
      file_URL: formData.file_URL?.trim(),
      description,
      Description: description,
      resource_description: description,
    };

    try {
      setError(null);
      setSuccess(null);
      if (editingResource) {
        await resourcesAPI.update(editingResource.resource_id || editingResource.id, payload);
        setSuccess('Resource updated successfully!');
      } else {
        await resourcesAPI.create(payload);
        setSuccess('Resource created successfully!');
      }
      await loadResources();
      closeModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save resource');
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title || '',
      description: getDescriptionValue(resource),
      file_URL: resource.file_URL || resource.file_url || '',
      access_level: resource.access_level || 'all',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setError(null);
      setSuccess(null);
      await resourcesAPI.delete(confirmDeleteId);
      setSuccess('Resource deleted successfully!');
      await loadResources();
      setConfirmDeleteId(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete resource');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingResource(null);
    setFormData(emptyForm);
  };

  const filteredResources = useMemo(() => {
    return resources
      .filter((resource) => {
        if (filter === 'all') return true;
        return (resource.access_level || 'all') === filter;
      })
      .filter((resource) => {
        const term = searchTerm.toLowerCase();
        return (
          resource.title?.toLowerCase().includes(term) ||
          getDescriptionValue(resource)?.toLowerCase().includes(term) ||
          resource.file_URL?.toLowerCase().includes(term) ||
          resource.file_url?.toLowerCase().includes(term)
        );
      });
  }, [resources, filter, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Resources</h1>
          <p className="text-gray-600 mt-1">
            Upload and manage guides, SOPs, and reference materials for your teams.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingResource(null);
            setFormData(emptyForm);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Resource</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All access levels</option>
            {ACCESS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No resources found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Title</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Access</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Link</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Description</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => (
                <tr key={resource.resource_id || resource.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="font-semibold text-gray-900">{resource.title}</p>
                        <p className="text-xs text-gray-500">
                          #{resource.resource_id || resource.id} · Uploaded by {resource.uploaded_by || 'Admin'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-md leading-tight whitespace-normal max-w-[10rem] text-center ${
                        resource.access_level === 'technician'
                          ? 'bg-purple-50 text-purple-700'
                          : resource.access_level === 'customer'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {getAccessLabel(resource.access_level || 'all')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {resource.file_URL || resource.file_url ? (
                      <a
                        href={resource.file_URL || resource.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View file
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No file</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {(() => {
                      const description = getDescriptionValue(resource);
                      if (!description) return '—';
                      const snippet = description.slice(0, 80);
                      return `${snippet}${description.length > 80 ? '...' : ''}`;
                    })()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit resource"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(resource.resource_id || resource.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingResource ? 'Edit Resource' : 'Add Resource'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., UPS Installation SOP"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide a short summary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">File URL *</label>
                <input
                  type="url"
                  name="file_URL"
                  value={formData.file_URL}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/resource.pdf"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Access level *</label>
                  <select
                    name="access_level"
                    value={formData.access_level}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ACCESS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Uploader</label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || user?.email || 'Admin'}
                    className="w-full px-4 py-2 border border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingResource ? 'Update' : 'Create'} Resource</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Resource</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this resource? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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

export default Resources;



