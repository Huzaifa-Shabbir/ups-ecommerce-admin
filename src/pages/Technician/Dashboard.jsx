import { useEffect, useMemo, useState } from 'react';
import { useTechnicianAuth } from '../../context/TechnicianAuthContext';
import { resourcesAPI, serviceRequestsAPI } from '../../services/api';
import {
  Loader2,
  Wrench,
  ClipboardCheck,
  Clock4,
  CheckCircle2,
  RefreshCcw,
  AlertCircle,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

const getResourceDescription = (resource = {}) =>
  resource.description ??
  resource.Description ??
  resource.resource_description ??
  resource.details ??
  '';

const TechnicianDashboard = () => {
  const { user } = useTechnicianAuth();
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadDashboard();
    }
  }, [user?.id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [requestsData, resourcesData] = await Promise.all([
        serviceRequestsAPI.getByTechnician(user.id),
        resourcesAPI.getForTechnicians(),
      ]);

      const requestList = Array.isArray(requestsData) ? requestsData : requestsData.requests || [];
      const resourceList = Array.isArray(resourcesData)
        ? resourcesData
        : resourcesData.resources || resourcesData.data || [];

      setRequests(requestList);
      setResources(resourceList.slice(0, 4));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load technician data');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = requests.filter((req) => req.status === 'pending').length;
    const assigned = requests.filter((req) => req.status === 'assigned').length;
    const completed = requests.filter((req) => req.status === 'completed').length;
    return {
      total: requests.length,
      pending,
      assigned,
      completed,
    };
  }, [requests]);

  const handleComplete = async (requestId) => {
    try {
      setError(null);
      setSuccess(null);
      await serviceRequestsAPI.complete(requestId);
      setSuccess('Nice work! Job marked as complete.');
      await loadDashboard();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update request');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name || user?.username}</h1>
          <p className="text-gray-600 mt-1">Stay on top of your assigned jobs and resources.</p>
        </div>
        <button
          onClick={loadDashboard}
          className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition"
        >
          <RefreshCcw className="w-4 h-4 text-gray-600" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600">
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total jobs" value={stats.total} icon={Wrench} color="text-blue-600" />
        <StatCard label="Pending review" value={stats.pending} icon={Clock4} color="text-amber-600" />
        <StatCard label="In progress" value={stats.assigned} icon={ClipboardCheck} color="text-indigo-600" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Active jobs</h2>
              <p className="text-sm text-gray-500">Track assigned and pending tasks</p>
            </div>
            <span className="text-sm text-gray-500">{requests.length} total</span>
          </div>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600">No jobs assigned yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {requests.map((request) => (
                <li key={request.request_id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span>Request #{request.request_id}</span>
                      <StatusBadge status={request.status} />
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Service #{request.service_id || 'N/A'} · Slot #{request.slot_id || 'N/A'}
                    </p>
                    {request.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.description}</p>
                    )}
                  </div>
                  {request.status === 'assigned' && (
                    <button
                      onClick={() => handleComplete(request.request_id)}
                      className="mt-3 md:mt-0 inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      Mark complete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick resources</h2>
              <p className="text-sm text-gray-500">Latest technician docs</p>
            </div>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          {resources.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No technician resources available.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {resources.map((resource) => (
                <li key={resource.resource_id || resource.id} className="p-4">
                  <p className="font-medium text-gray-900">{resource.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {getResourceDescription(resource) || 'Resource description unavailable'}
                  </p>
                  {resource.file_URL || resource.file_url ? (
                    <a
                      href={resource.file_URL || resource.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-sm inline-flex items-center space-x-1 mt-2 hover:underline"
                    >
                      <span>Open file</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-amber-100 text-amber-700',
    assigned: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center space-x-4">
    <div className={`p-3 rounded-lg bg-gray-50 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

export default TechnicianDashboard;



