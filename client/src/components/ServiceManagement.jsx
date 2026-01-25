import { useState, useEffect, useMemo } from "react";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../services/api";

function ServiceManagement() {
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    priceType: "FIXED",
    unit: "",
  });

  // Filter state
  const [filterText, setFilterText] = useState("");
  const [filterPriceType, setFilterPriceType] = useState("");

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getServices();
      setAllServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load services list.");
      setAllServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter
  const filteredServices = useMemo(() => {
    return allServices.filter((s) => {
      const matchText =
        !filterText ||
        s.name.toLowerCase().includes(filterText.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(filterText.toLowerCase());

      const matchType = !filterPriceType || s.priceType === filterPriceType;

      return matchText && matchType;
    });
  }, [allServices, filterText, filterPriceType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.price || !formData.priceType) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        priceType: formData.priceType,
        unit: formData.unit,
      };

      if (editingService) {
        const updated = await updateService(editingService.id, payload);
        setAllServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? updated : s)),
        );
      } else {
        const created = await createService(payload);
        setAllServices((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err.message || "Unable to save service.");
    }
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      priceType: service.priceType,
      unit: service.unit || "",
    });
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(id);
        setAllServices((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        setError(err.message || "Unable to delete service.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      priceType: "FIXED",
      unit: "",
    });
    setEditingService(null);
    setShowForm(false);
  };

  const getPriceTypeLabel = (type) => {
    switch (type) {
      case "FIXED":
        return "Fixed";
      case "UNIT_BASED":
        return "Unit-Based";
      case "PERCENTAGE":
        return "Percentage";
      default:
        return type;
    }
  };

  const getPriceTypeBadgeColor = (type) => {
    switch (type) {
      case "FIXED":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "UNIT_BASED":
        return "bg-gray-200 text-gray-900 border-gray-400";
      case "PERCENTAGE":
        return "bg-gray-700 text-white border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US").format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Service Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage your services portfolio - WiFi, laundry, parking, and
                more
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              {showForm ? "Cancel" : "New Service"}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {editingService ? "Edit Service" : "Create New Service"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., WiFi, Laundry, Parking..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="100.00"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                    min={0}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Price Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priceType}
                    onChange={(e) =>
                      setFormData({ ...formData, priceType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                  >
                    <option value="FIXED">Fixed Price</option>
                    <option value="UNIT_BASED">Unit-Based</option>
                    <option value="PERCENTAGE">Percentage</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Unit (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., /month, /time, /vehicle"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Enter service details and features..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors bg-gray-50 focus:bg-white resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  type="submit"
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-xl"
                >
                  {editingService ? "Update Service" : "Create Service"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg transition-all duration-200 font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Section */}
        {!showForm && (
          <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Search Services
                </label>
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Filter by Type
                </label>
                <select
                  value={filterPriceType}
                  onChange={(e) => setFilterPriceType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors bg-gray-50 focus:bg-white"
                >
                  <option value="">All Types</option>
                  <option value="FIXED">Fixed Price</option>
                  <option value="UNIT_BASED">Unit-Based</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-600"></div>
            <p className="text-gray-600 mt-4 font-medium">
              Loading services...
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg font-medium">
              {allServices.length === 0
                ? "No services available yet. Create your first service!"
                : "No services match your search criteria."}
            </p>
          </div>
        ) : (
          /* Services Grid - Responsive Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-gray-600 to-gray-500 p-5">
                  <h3 className="text-xl font-bold text-white truncate mb-2">
                    {service.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      ${formatPrice(service.price)}
                    </span>
                    {service.unit && (
                      <span className="text-gray-300 text-sm">
                        {service.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="mb-4">
                    <span
                      className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border ${getPriceTypeBadgeColor(
                        service.priceType,
                      )}`}
                    >
                      {getPriceTypeLabel(service.priceType)}
                    </span>
                  </div>

                  <div className="mb-5">
                    <p className="text-gray-600 text-sm line-clamp-3 min-h-[60px]">
                      {service.description || "No description provided."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex-1 bg-gray-200 hover:bg-gray-700 hover:text-white text-gray-900 px-4 py-2.5 rounded-lg transition-all duration-200 font-bold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="flex-1 bg-gray-200 hover:bg-gray-700 hover:text-white text-gray-900 px-4 py-2.5 rounded-lg transition-all duration-200 font-bold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceManagement;
