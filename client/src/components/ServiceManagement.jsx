import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import Loading from "./loading.jsx";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../services/api";

// ── Validation ────────────────────────────────────────────────────────────────
function validateServiceForm(formData) {
  const errors = {};

  if (!formData.name.trim()) {
    errors.name = "Service name is required.";
  } else if (formData.name.trim().length < 2) {
    errors.name = "Service name must be at least 2 characters.";
  } else if (formData.name.trim().length > 100) {
    errors.name = "Service name must not exceed 100 characters.";
  }

  if (formData.price === "" || formData.price === null) {
    errors.price = "Price is required.";
  } else if (isNaN(Number(formData.price))) {
    errors.price = "Price must be a valid number.";
  } else if (Number(formData.price) < 0) {
    errors.price = "Price must be 0 or greater.";
  } else if (Number(formData.price) > 1_000_000) {
    errors.price = "Price must not exceed 1,000,000.";
  }

  if (!formData.priceType) {
    errors.priceType = "Price type is required.";
  }

  if (formData.unit && formData.unit.length > 50) {
    errors.unit = "Unit must not exceed 50 characters.";
  }

  if (formData.description && formData.description.length > 500) {
    errors.description = "Description must not exceed 500 characters.";
  }

  return errors;
}

// ── Main Component ────────────────────────────────────────────────────────────
function ServiceManagement() {
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    priceType: "FIXED",
    unit: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Filter state
  const [filterText, setFilterText] = useState("");
  const [filterPriceType, setFilterPriceType] = useState("");

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices();
      setAllServices(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Unable to load services list.");
      setAllServices([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateServiceForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setFieldErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        priceType: formData.priceType,
        unit: formData.unit.trim(),
      };

      if (editingService) {
        const updated = await updateService(editingService.id, payload);
        setAllServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? updated : s)),
        );
        toast.success(`"${payload.name}" updated successfully.`);
      } else {
        const created = await createService(payload);
        setAllServices((prev) => [created, ...prev]);
        toast.success(`"${payload.name}" created successfully.`);
      }
      resetForm();
    } catch (err) {
      toast.error(err.message || "Unable to save service.");
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
    setFieldErrors({});
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const service = allServices.find((s) => s.id === id);
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(id);
        setAllServices((prev) => prev.filter((s) => s.id !== id));
        toast.success(`"${service?.name || "Service"}" deleted.`);
      } catch (err) {
        toast.error(err.message || "Unable to delete service.");
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
    setFieldErrors({});
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

  const formatPrice = (price) => new Intl.NumberFormat("en-US").format(price);

  const inputCls = (field) =>
    `w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-50 focus:bg-white ${
      fieldErrors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-gray-300 focus:border-gray-500"
    }`;

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

        {/* Form Section */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-linear-to-r from-gray-700 to-gray-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {editingService ? "Edit Service" : "Create New Service"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., WiFi, Laundry, Parking..."
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={inputCls("name")}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="100.00"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    className={inputCls("price")}
                    min={0}
                    step="0.01"
                  />
                  {fieldErrors.price && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">
                      {fieldErrors.price}
                    </p>
                  )}
                </div>

                {/* Price Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Price Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priceType}
                    onChange={(e) => handleChange("priceType", e.target.value)}
                    className={inputCls("priceType")}
                  >
                    <option value="FIXED">Fixed Price</option>
                    <option value="UNIT_BASED">Unit-Based</option>
                    <option value="PERCENTAGE">Percentage</option>
                  </select>
                  {fieldErrors.priceType && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">
                      {fieldErrors.priceType}
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Unit (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., /month, /time, /vehicle"
                    value={formData.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    className={inputCls("unit")}
                  />
                  {fieldErrors.unit && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">
                      {fieldErrors.unit}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Enter service details and features..."
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    className={inputCls("description") + " resize-none"}
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {fieldErrors.description ? (
                      <p className="text-xs text-red-600 font-medium">
                        {fieldErrors.description}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p
                      className={`text-xs ${formData.description.length > 480 ? "text-red-500" : "text-gray-400"}`}
                    >
                      {formData.description.length}/500
                    </p>
                  </div>
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
        <Loading isLoading={loading} />
        {!loading &&
          (filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-200">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 text-lg font-medium">
                {allServices.length === 0
                  ? "No services available yet. Create your first service!"
                  : "No services match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="bg-linear-to-r from-gray-600 to-gray-500 p-5">
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

                  <div className="p-5">
                    <div className="mb-4">
                      <span
                        className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border ${getPriceTypeBadgeColor(service.priceType)}`}
                      >
                        {getPriceTypeLabel(service.priceType)}
                      </span>
                    </div>

                    <div className="mb-5">
                      <p className="text-gray-600 text-sm line-clamp-3 min-h-15">
                        {service.description || "No description provided."}
                      </p>
                    </div>

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
          ))}
      </div>
    </div>
  );
}

export default ServiceManagement;
