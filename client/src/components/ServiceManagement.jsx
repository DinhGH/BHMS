import { useState, useEffect } from "react";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../services/api";

function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [houseId, setHouseId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    priceType: "FIXED",
    unit: "",
  });

  // Load services on mount
  useEffect(() => {
    const storedHouseId = localStorage.getItem("selectedHouseId");
    if (storedHouseId) {
      setHouseId(parseInt(storedHouseId));
      loadServices(parseInt(storedHouseId));
    }
  }, []);

  const loadServices = async (id) => {
    setLoading(true);
    setError("");
    try {
      const data = await getServices(id);
      setServices(data);
    } catch (err) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.price || !formData.priceType) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        const updated = await updateService(editingId, formData);
        setServices(services.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const newService = await createService({
          houseId,
          ...formData,
        });
        setServices([newService, ...services]);
      }
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save service");
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
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(id);
        setServices(services.filter((s) => s.id !== id));
      } catch (err) {
        setError(err.message || "Failed to delete service");
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
    setEditingId(null);
    setShowForm(false);
  };

  const getPriceTypeLabel = (type) => {
    const labels = {
      FIXED: "Giá cố định/phòng",
      UNIT_BASED: "Giá theo đơn vị",
      PERCENTAGE: "Phần trăm",
    };
    return labels[type] || type;
  };

  if (!houseId) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Service Management
          </h1>
          <p className="text-gray-600">Please select a boarding house first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">
            Service Management
          </h1>
          <p className="text-gray-600">Quản lý các tiện ích của nhà trọ</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? "Cancel" : "Add Service"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Service" : "Add New Service"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                placeholder="e.g., WiFi, Máy giặt, ..."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Type *
              </label>
              <select
                value={formData.priceType}
                onChange={(e) =>
                  setFormData({ ...formData, priceType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FIXED">Giá cố định/phòng</option>
                <option value="UNIT_BASED">Giá theo đơn vị</option>
                <option value="PERCENTAGE">Phần trăm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                placeholder="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit (e.g., kWh, times/month)
              </label>
              <input
                type="text"
                placeholder="e.g., kWh, times/month"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Enter service description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="p-6 bg-white border border-gray-200 rounded-lg text-center">
          <p className="text-gray-600">
            No services yet. Add one to get started!
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Service Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Price Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getPriceTypeLabel(service.priceType)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {service.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.unit || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceManagement;
