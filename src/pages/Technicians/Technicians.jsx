import { useEffect, useMemo, useState } from 'react';
import { techniciansAPI } from '../../services/api';
import {
  Users,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  X,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Trash2,
  Loader2,
} from 'lucide-react';

const initialForm = {
  name: '',
  email: '',
  username: '',
  password: '',
  phone_Number: '',
};

const Technicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const data = await techniciansAPI.getAll();
      const list = Array.isArray(data) ? data : data.technicians || data.data || [];
      setTechnicians(list);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await techniciansAPI.register(formData);
      setSuccess('Technician created successfully.');
      setShowModal(false);
      setFormData(initialForm);
      fetchTechnicians();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create technician');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    setSuccess(null);
    try {
      await techniciansAPI.deactivate(deleteTarget.user_Id || deleteTarget.user_id);
      setSuccess('Technician removed successfully.');
      setDeleteTarget(null);
      fetchTechnicians();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove technician');
    }
  };

  const filteredTechnicians = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return technicians.filter((tech) => {
      return (
        tech.name?.toLowerCase().includes(term) ||
        tech.email?.toLowerCase().includes(term) ||
        tech.username?.toLowerCase().includes(term) ||
        tech.phone_Number?.toString().includes(term)
      );
    });
  }, [technicians, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Technicians</h1>
          <p className="text-gray-600 mt-1">
            View, create, and remove technicians who can access the technician dashboard.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(initialForm);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Technician</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{success}</p>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total technicians" value={technicians.length} />
        <StatCard label="Active technicians" value={technicians.filter((tech) => tech.is_active).length} />
        <StatCard label="Inactive technicians" value={technicians.filter((tech) => tech.is_active === false).length} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, username, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredTechnicians.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No technicians match your search.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Technician</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Contact</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTechnicians.map((tech) => (
                <tr key={tech.user_Id || tech.user_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-6 h-6 text-indigo-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{tech.name || tech.username}</p>
                        <p className="text-sm text-gray-500">@{tech.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{tech.email || '—'}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{tech.phone_Number || '—'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tech.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tech.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setDeleteTarget(tech)}
                      className="inline-flex items-center space-x-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Technician</h2>
                <p className="text-sm text-gray-500 mt-1">Create credentials for a new technician account.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="janesmith"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="technician@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input
                    name="phone_Number"
                    value={formData.phone_Number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+123456789"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Temporary Password *</label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Strong password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Share this password with the technician. They can change it after logging in.
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Technician</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Remove Technician</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600">
              Are you sure you want to remove <span className="font-semibold">{deleteTarget.name || deleteTarget.username}</span>?
              They will lose access to the technician dashboard.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteTarget(null)}
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

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center space-x-3">
    <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
      <Users className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

export default Technicians;

