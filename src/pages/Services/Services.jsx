import { useState, useEffect } from 'react';
import { servicesAPI, slotsAPI, serviceRequestsAPI } from '../../services/api';
import { Wrench, Plus, Edit, Trash2, Search, Save, X, AlertCircle, CheckCircle, ToggleLeft, ToggleRight, Calendar, Clock } from 'lucide-react';

const Services = () => {
  // Service Requests state
  // Service Requests state
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
  const [serviceRequestsError, setServiceRequestsError] = useState(null);
  const [serviceRequestsSuccess, setServiceRequestsSuccess] = useState(null);
  const [serviceRequestsSearch, setServiceRequestsSearch] = useState('');
  const [assignTechnicianModal, setAssignTechnicianModal] = useState(null); // { request, technicianId }
  const [assignTechnicianId, setAssignTechnicianId] = useState('');
  const [serviceRequestsUserId, setServiceRequestsUserId] = useState('');
  const [serviceRequestsTechnicianId, setServiceRequestsTechnicianId] = useState('');
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('services'); // 'services' or 'slots'
  
  // Service modals
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDeleteServiceConfirm, setShowDeleteServiceConfirm] = useState(null);
  
  // Slot modals
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showDeleteSlotConfirm, setShowDeleteSlotConfirm] = useState(null);
  
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    availability: true,
    is_available: true,
  });

  const [slotFormData, setSlotFormData] = useState({
    slot_time: '',
    service_id: '',
    date: '',
    is_available: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Load service requests when tab is 'requests'
  useEffect(() => {
    if (activeTab === 'requests') {
      setServiceRequestsLoading(true);
      let fetchPromise;
      if (serviceRequestsUserId) {
        fetchPromise = serviceRequestsAPI.getByUser(serviceRequestsUserId);
      } else if (serviceRequestsTechnicianId) {
        fetchPromise = serviceRequestsAPI.getByTechnician(serviceRequestsTechnicianId);
      } else {
        fetchPromise = serviceRequestsAPI.getAll();
      }
      fetchPromise
        .then((data) => {
          setServiceRequests(Array.isArray(data) ? data : (data.requests || []));
          setServiceRequestsError(null);
        })
        .catch((err) => {
          setServiceRequestsError('Failed to load service requests');
        })
        .finally(() => setServiceRequestsLoading(false));
    }
  }, [activeTab, serviceRequestsUserId, serviceRequestsTechnicianId]);
  // UI handlers for user/technician filter
  const handleServiceRequestsUserIdChange = (e) => {
    setServiceRequestsUserId(e.target.value);
    setServiceRequestsTechnicianId('');
  };
  const handleServiceRequestsTechnicianIdChange = (e) => {
    setServiceRequestsTechnicianId(e.target.value);
    setServiceRequestsUserId('');
  };
  // Service Requests actions
  const handleAssignTechnician = async (requestId, technicianId) => {
    try {
      setServiceRequestsError(null);
      setServiceRequestsSuccess(null);
      await serviceRequestsAPI.assignTechnician(requestId, technicianId);
      setServiceRequestsSuccess('Technician assigned successfully!');
      setAssignTechnicianModal(null);
      setAssignTechnicianId('');
      // Reload requests
      const data = await serviceRequestsAPI.getAll();
      setServiceRequests(Array.isArray(data) ? data : (data.requests || []));
      setTimeout(() => setServiceRequestsSuccess(null), 3000);
    } catch (err) {
      setServiceRequestsError(err.message || 'Failed to assign technician');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      setServiceRequestsError(null);
      setServiceRequestsSuccess(null);
      await serviceRequestsAPI.decline(requestId);
      setServiceRequestsSuccess('Request declined successfully!');
      const data = await serviceRequestsAPI.getAll();
      setServiceRequests(Array.isArray(data) ? data : (data.requests || []));
      setTimeout(() => setServiceRequestsSuccess(null), 3000);
    } catch (err) {
      setServiceRequestsError(err.message || 'Failed to decline request');
    }
  };

  const handleCompleteRequest = async (requestId) => {
    try {
      setServiceRequestsError(null);
      setServiceRequestsSuccess(null);
      await serviceRequestsAPI.complete(requestId);
      setServiceRequestsSuccess('Request marked as completed!');
      const data = await serviceRequestsAPI.getAll();
      setServiceRequests(Array.isArray(data) ? data : (data.requests || []));
      setTimeout(() => setServiceRequestsSuccess(null), 3000);
    } catch (err) {
      setServiceRequestsError(err.message || 'Failed to complete request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      setServiceRequestsError(null);
      setServiceRequestsSuccess(null);
      await serviceRequestsAPI.delete(requestId);
      setServiceRequestsSuccess('Request deleted successfully!');
      const data = await serviceRequestsAPI.getAll();
      setServiceRequests(Array.isArray(data) ? data : (data.requests || []));
      setTimeout(() => setServiceRequestsSuccess(null), 3000);
    } catch (err) {
      setServiceRequestsError(err.message || 'Failed to delete request');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load services
      const servicesData = await servicesAPI.getAll();
      const servicesList = Array.isArray(servicesData) ? servicesData : (servicesData.services || []);
      setServices(servicesList);
      
      // Load slots
      const slotsData = await slotsAPI.getAll();
      const slotsList = Array.isArray(slotsData) ? slotsData : (slotsData.slots || []);
      setSlots(slotsList);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Service handlers
  const handleServiceInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServiceFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const serviceData = {
        service_name: serviceFormData.service_name || serviceFormData.name,
        name: serviceFormData.name || serviceFormData.service_name,
        description: serviceFormData.description || null,
        price: parseFloat(serviceFormData.price) || 0,
        duration: serviceFormData.duration || null,
        availability: serviceFormData.availability !== false && serviceFormData.is_available !== false,
        is_available: serviceFormData.is_available !== false && serviceFormData.availability !== false,
      };

      if (editingService) {
        await servicesAPI.update(editingService.id || editingService.service_id, serviceData);
        setSuccess('Service updated successfully!');
      } else {
        await servicesAPI.create(serviceData);
        setSuccess('Service created successfully!');
      }

      setShowServiceModal(false);
      setEditingService(null);
      setServiceFormData({ service_name: '', name: '', description: '', price: '', duration: '', availability: true, is_available: true });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceFormData({
      service_name: service.service_name || service.name || '',
      name: service.name || service.service_name || '',
      description: service.description || '',
      price: service.price || '',
      duration: service.duration || '',
      availability: service.availability !== false && service.is_available !== false,
      is_available: service.is_available !== false && service.availability !== false,
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await servicesAPI.delete(serviceId);
      setSuccess('Service deleted successfully!');
      setShowDeleteServiceConfirm(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete service');
    }
  };

  const toggleServiceAvailability = async (service) => {
    try {
      setError(null);
      setSuccess(null);
      const newAvailability = !(service.is_available !== false && service.availability !== false);
      await servicesAPI.update(service.id || service.service_id, {
        ...service,
        is_available: newAvailability,
        availability: newAvailability,
      });
      setSuccess(`Service ${newAvailability ? 'enabled' : 'disabled'} successfully!`);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to toggle availability');
    }
  };

  // Slot handlers
  const handleSlotInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSlotFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const slotData = {
        slot_time: slotFormData.slot_time,
        service_id: slotFormData.service_id || null,
        date: slotFormData.date || null,
        is_available: slotFormData.is_available !== false,
      };

      if (editingSlot) {
        await slotsAPI.update(editingSlot.id || editingSlot.slot_id, slotData);
        setSuccess('Slot updated successfully!');
      } else {
        await slotsAPI.create(slotData);
        setSuccess('Slot created successfully!');
      }

      setShowSlotModal(false);
      setEditingSlot(null);
      setSlotFormData({ slot_time: '', service_id: '', date: '', is_available: true });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save slot');
    }
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotFormData({
      slot_time: slot.slot_time || '',
      service_id: slot.service_id || '',
      date: slot.date || '',
      is_available: slot.is_available !== false,
    });
    setShowSlotModal(true);
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await slotsAPI.delete(slotId);
      setSuccess('Slot deleted successfully!');
      setShowDeleteSlotConfirm(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete slot');
    }
  };

  const toggleSlotAvailability = async (slot) => {
    try {
      setError(null);
      setSuccess(null);
      const newAvailability = !(slot.is_available !== false);
      await slotsAPI.update(slot.id || slot.slot_id, {
        ...slot,
        is_available: newAvailability,
      });
      setSuccess(`Slot ${newAvailability ? 'enabled' : 'disabled'} successfully!`);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to toggle slot availability');
    }
  };

  // Filter data based on search term

  const filteredServices = services.filter((service) =>
    (service.service_name || service.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.id?.toString().includes(searchTerm) ||
    service.service_id?.toString().includes(searchTerm)
  );

  const filteredSlots = slots.filter((slot) =>
    slot.slot_time?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slot.service_id?.toString().includes(searchTerm) ||
    slot.id?.toString().includes(searchTerm) ||
    slot.slot_id?.toString().includes(searchTerm)
  );

  const filteredServiceRequests = serviceRequests.filter((req) => {
    const term = serviceRequestsSearch.toLowerCase();
    return (
      req.id?.toString().includes(term) ||
      req.status?.toLowerCase().includes(term) ||
      req.customer_name?.toLowerCase().includes(term) ||
      req.technician_name?.toLowerCase().includes(term) ||
      req.service_name?.toLowerCase().includes(term) ||
      req.address?.toLowerCase().includes(term) ||
      req.created_at?.toString().includes(term)
    );
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Services & Slots</h1>
          <p className="text-gray-600 mt-1">View and manage services and their available time slots</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'services') {
              setEditingService(null);
              setServiceFormData({ service_name: '', name: '', description: '', price: '', duration: '', availability: true, is_available: true });
              setShowServiceModal(true);
            } else {
              setEditingSlot(null);
              setSlotFormData({ slot_time: '', service_id: '', date: '', is_available: true });
              setShowSlotModal(true);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add {activeTab === 'services' ? 'Service' : 'Slot'}</span>
        </button>
      </div>

      {/* Error/Success Messages */}
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

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Services ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'slots'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Time Slots ({slots.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Service Requests
            </button>
          </nav>
        </div>
      </div>


      {/* Search Bar */}
      {activeTab !== 'requests' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search service requests..."
              value={serviceRequestsSearch}
              onChange={(e) => setServiceRequestsSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
      {/* Service Requests Table */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filter by user or technician */}
          <div className="flex items-center space-x-4 p-4">
            <input
              type="text"
              placeholder="Filter by Customer/User ID"
              value={serviceRequestsUserId}
              onChange={handleServiceRequestsUserIdChange}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Filter by Technician ID"
              value={serviceRequestsTechnicianId}
              onChange={handleServiceRequestsTechnicianIdChange}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {serviceRequestsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 flex-1">{serviceRequestsError}</p>
              <button onClick={() => setServiceRequestsError(null)} className="ml-auto">
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
          {serviceRequestsSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700">{serviceRequestsSuccess}</p>
              <button onClick={() => setServiceRequestsSuccess(null)} className="ml-auto">
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          )}
          {serviceRequestsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredServiceRequests.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Request ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Customer/User ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Service ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Slot ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Technician ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Request Date</th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServiceRequests.map((req) => (
                  <tr key={req.request_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-4 px-6 text-gray-600">#{req.request_id}</td>
                    <td className="py-4 px-6 text-gray-900 font-semibold">{req.user_Id || req.customer_id || 'N/A'}</td>
                    <td className="py-4 px-6">{req.service_id || 'N/A'}</td>
                    <td className="py-4 px-6">{req.slot_id || 'N/A'}</td>
                    <td className="py-4 px-6">{req.technician_id || 'Unassigned'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'declined' ? 'bg-red-100 text-red-800' :
                        req.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">{req.description || 'N/A'}</td>
                    <td className="py-4 px-6">{req.request_date ? req.request_date : 'N/A'}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => setAssignTechnicianModal(req)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Assign Technician"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        )}
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleDeclineRequest(req.request_id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                            title="Decline"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                        {req.status === 'assigned' && (
                          <button
                            onClick={() => handleCompleteRequest(req.request_id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Mark Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req.request_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No service requests found</p>
            </div>
          )}
        </div>
      )}

      {/* Assign Technician Modal */}
      {assignTechnicianModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Technician</h3>
            <p className="text-gray-600 mb-6">Assign a technician to this service request.</p>
            <input
              type="text"
              placeholder="Technician ID"
              value={assignTechnicianId}
              onChange={e => setAssignTechnicianId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setAssignTechnicianModal(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignTechnician(assignTechnicianModal.id, assignTechnicianId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={!assignTechnicianId}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredServices.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Service ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Price</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Duration</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Availability</th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => {
                  const isAvailable = service.is_available !== false && service.availability !== false;
                  return (
                    <tr key={service.id || service.service_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-4 px-6 text-gray-600">#{service.id || service.service_id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Wrench className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{service.service_name || service.name || 'Unnamed Service'}</p>
                            {service.description && (
                              <p className="text-sm text-gray-500">{service.description.substring(0, 50)}...</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-semibold">
                        ${parseFloat(service.price || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{service.duration || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => toggleServiceAvailability(service)}
                          className="flex items-center space-x-2"
                        >
                          {isAvailable ? (
                            <>
                              <ToggleRight className="w-6 h-6 text-green-600" />
                              <span className="text-green-800 font-semibold">Available</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-6 h-6 text-gray-400" />
                              <span className="text-gray-600">Unavailable</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteServiceConfirm(service.id || service.service_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No services found</p>
            </div>
          )}
        </div>
      )}

      {/* Slots Table */}
      {activeTab === 'slots' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredSlots.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Slot ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Time Slot</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Service ID</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Availability</th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.map((slot) => {
                  const isAvailable = slot.is_available !== false;
                  return (
                    <tr key={slot.id || slot.slot_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-4 px-6 text-gray-600">#{slot.id || slot.slot_id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{slot.slot_time || 'No time specified'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {slot.service_id ? `#${slot.service_id}` : 'All Services'}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {slot.date ? new Date(slot.date).toLocaleDateString() : 'Any Date'}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => toggleSlotAvailability(slot)}
                          className="flex items-center space-x-2"
                        >
                          {isAvailable ? (
                            <>
                              <ToggleRight className="w-6 h-6 text-green-600" />
                              <span className="text-green-800 font-semibold">Available</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-6 h-6 text-gray-400" />
                              <span className="text-gray-600">Unavailable</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditSlot(slot)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteSlotConfirm(slot.id || slot.slot_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No time slots found</p>
            </div>
          )}
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingService(null);
                  setServiceFormData({ service_name: '', name: '', description: '', price: '', duration: '', availability: true, is_available: true });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Service Name *</label>
                <input
                  type="text"
                  name="service_name"
                  value={serviceFormData.service_name}
                  onChange={handleServiceInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter service name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={serviceFormData.description}
                  onChange={handleServiceInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter service description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={serviceFormData.price}
                    onChange={handleServiceInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={serviceFormData.duration}
                    onChange={handleServiceInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1 hour, 30 minutes"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="availability"
                  checked={serviceFormData.availability}
                  onChange={handleServiceInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-semibold text-gray-700">Available</label>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingService(null);
                    setServiceFormData({ service_name: '', name: '', description: '', price: '', duration: '', availability: true, is_available: true });
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
                  <span>{editingService ? 'Update' : 'Create'} Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
              </h2>
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  setEditingSlot(null);
                  setSlotFormData({ slot_time: '', service_id: '', date: '', is_available: true });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSlotSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time Slot *</label>
                <input
                  type="text"
                  name="slot_time"
                  value={slotFormData.slot_time}
                  onChange={handleSlotInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 9am-10am, 2pm-3pm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service ID</label>
                  <select
                    name="service_id"
                    value={slotFormData.service_id}
                    onChange={handleSlotInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Services</option>
                    {services.map(service => (
                      <option key={service.id || service.service_id} value={service.id || service.service_id}>
                        {service.service_name || service.name} (#{service.id || service.service_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={slotFormData.date}
                    onChange={handleSlotInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={slotFormData.is_available}
                  onChange={handleSlotInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-semibold text-gray-700">Available</label>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowSlotModal(false);
                    setEditingSlot(null);
                    setSlotFormData({ slot_time: '', service_id: '', date: '', is_available: true });
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
                  <span>{editingSlot ? 'Update' : 'Create'} Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
      {showDeleteServiceConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this service? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteServiceConfirm(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteService(showDeleteServiceConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Slot Confirmation Modal */}
      {showDeleteSlotConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this time slot? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteSlotConfirm(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSlot(showDeleteSlotConfirm)}
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

export default Services;