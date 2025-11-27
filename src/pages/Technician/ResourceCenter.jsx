import { useEffect, useState } from 'react';
import { resourcesAPI } from '../../services/api';
import { useTechnicianAuth } from '../../context/TechnicianAuthContext';
import { Search, BookOpen, Download, Loader2, AlertCircle, FileText } from 'lucide-react';

const pickDescription = (resource = {}) =>
  resource.description ??
  resource.Description ??
  resource.resource_description ??
  resource.details ??
  '';

const TechnicianResourceCenter = () => {
  const { user } = useTechnicianAuth();
  const [resources, setResources] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(resources);
    } else {
      const term = searchTerm.toLowerCase();
      setFiltered(
        resources.filter(
          (resource) =>
            resource.title?.toLowerCase().includes(term) ||
            pickDescription(resource)?.toLowerCase().includes(term) ||
            resource.file_URL?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, resources]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await resourcesAPI.getForTechnicians();
      const list = Array.isArray(data) ? data : data.resources || data.data || [];
      setResources(list);
      setFiltered(list);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load resources');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Technician Resource Center</h1>
          <p className="text-gray-600 mt-1">
            Access installation manuals, troubleshooting guides, and SOPs curated for technicians.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Signed in as <span className="font-semibold text-gray-900">{user?.email}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 flex-1">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by title, description, or link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No resources match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((resource) => (
            <article
              key={resource.resource_id || resource.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-indigo-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                  <p className="text-xs text-gray-500">#{resource.resource_id || resource.id}</p>
                </div>
              </div>
              {pickDescription(resource) && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{pickDescription(resource)}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-50 text-indigo-700">
                  Technician
                </span>
                {resource.file_URL || resource.file_url ? (
                  <a
                    href={resource.file_URL || resource.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 font-semibold hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    <span>Open</span>
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">File unavailable</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianResourceCenter;



