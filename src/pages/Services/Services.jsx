import { useState, useEffect } from 'react';
import { servicesAPI, slotsAPI } from '../../services/api';
import { Wrench, Plus, Edit, Trash2, Search, Save, X, AlertCircle, CheckCircle, ToggleLeft, ToggleRight, Calendar, Clock } from 'lucide-react';

const Services = () => {
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
    service_name: '',
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
          </nav>
        </div>
      </div>

      {/* Search Bar */}
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