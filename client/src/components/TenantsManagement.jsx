import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Loading from "./loading.jsx";
import {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../services/api";

// ── Validation ────────────────────────────────────────────────────────────────
function validateTenantForm(formData) {
  const errors = {};

  if (!formData.fullName.trim()) {
    errors.fullName = "Name is required.";
  } else if (formData.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters.";
  } else if (formData.fullName.trim().length > 100) {
    errors.fullName = "Name must not exceed 100 characters.";
  }

  if (!formData.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (formData.phone && !/^[0-9+\-\s()]{7,15}$/.test(formData.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (formData.age !== "" && formData.age !== null) {
    const age = parseInt(formData.age);
    if (isNaN(age)) {
      errors.age = "Age must be a valid number.";
    } else if (age < 18) {
      errors.age = "Age must be at least 18 years old.";
    } else if (age > 120) {
      errors.age = "Age must not exceed 120.";
    }
  }

  if (formData.roomId !== "" && formData.roomId !== null) {
    const roomId = parseInt(formData.roomId);
    if (isNaN(roomId) || roomId < 1) {
      errors.roomId = "Please enter a valid room ID (≥ 1).";
    }
  }

  if (!formData.startDate) {
    errors.startDate = "Start date is required.";
  }

  return errors;
}

// ── Main Component ────────────────────────────────────────────────────────────
function TenantsManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "OTHER",
    age: "",
    roomId: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await getTenants();
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load tenants.");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter & search
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      (tenant.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (tenant.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.phone || "").includes(searchTerm);

    const matchesStatus =
      filterStatus === "all" ||
      (tenant.status || "").toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      gender: "OTHER",
      age: "",
      roomId: "",
      startDate: new Date().toISOString().split("T")[0],
    });
    setFieldErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    const errors = validateTenantForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setFieldErrors({});

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        age: formData.age !== "" ? parseInt(formData.age) : 0,
        roomId: formData.roomId ? parseInt(formData.roomId) : null,
        startDate: formData.startDate,
      };

      if (editingId) {
        await updateTenant(editingId, payload);
        toast.success(`"${payload.fullName}" updated successfully.`);
      } else {
        await createTenant(payload);
        toast.success(`"${payload.fullName}" added successfully.`);
      }

      fetchTenants();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Unable to save data.");
    }
  };

  const handleDelete = async (id) => {
    const tenant = tenants.find((t) => t.id === id);
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      try {
        await deleteTenant(id);
        toast.success(`"${tenant?.fullName || "Tenant"}" deleted.`);
        fetchTenants();
      } catch (err) {
        toast.error(err.message || "Unable to delete.");
      }
    }
  };

  const handleEdit = (tenant) => {
    setFormData({
      fullName: tenant.fullName || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      gender: tenant.gender || "OTHER",
      age: tenant.age || "",
      roomId: tenant.roomId || "",
      startDate: tenant.startDate
        ? new Date(tenant.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setFieldErrors({});
    setEditingId(tenant.id);
    setShowForm(true);
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one tenant to delete.");
      return;
    }

    if (
      window.confirm(
        `Delete ${selectedIds.length} tenants? This cannot be undone!`,
      )
    ) {
      try {
        for (const id of selectedIds) {
          await deleteTenant(id);
        }
        toast.success(`${selectedIds.length} tenant(s) deleted.`);
        fetchTenants();
        setSelectedIds([]);
      } catch (err) {
        toast.error(err.message || "Unable to delete.");
      }
    }
  };

  const inputCls = (field) =>
    `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
      fieldErrors[field]
        ? "border-red-400 focus:ring-red-300"
        : "border-gray-300 focus:ring-blue-500"
    }`;

  if (loading) return <Loading isLoading={true} />;

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Tenant Management
        </h1>
        <p className="text-gray-600">List of all tenants</p>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 min-w-60 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? "Cancel" : "+ Add Tenant"}
        </button>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Delete ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 border border-gray-300 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Tenant" : "Add New Tenant"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
                placeholder="Enter name"
                className={inputCls("fullName")}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="user@example.com"
                className={inputCls("email")}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="0123456789"
                className={inputCls("phone")}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                className={inputCls("gender")}
              >
                <option value="OTHER">Other</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-semibold mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleFormChange}
                placeholder="25"
                className={inputCls("age")}
              />
              {fieldErrors.age && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.age}
                </p>
              )}
            </div>

            {/* Room ID */}
            <div>
              <label className="block text-sm font-semibold mb-1">Room</label>
              <input
                type="number"
                name="roomId"
                value={formData.roomId}
                onChange={handleFormChange}
                placeholder="1 (optional)"
                className={inputCls("roomId")}
              />
              {fieldErrors.roomId && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.roomId}
                </p>
              )}
            </div>

            {/* Start date */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleFormChange}
                className={inputCls("startDate")}
              />
              {fieldErrors.startDate && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.startDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Save
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-white shadow rounded-lg overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === paginatedTenants.length &&
                      paginatedTenants.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(paginatedTenants.map((t) => t.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Phone</th>
                <th className="px-6 py-3 text-left font-semibold">Gender</th>
                <th className="px-6 py-3 text-left font-semibold">Room</th>
                <th className="px-6 py-3 text-left font-semibold">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTenants.length > 0 ? (
                paginatedTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(tenant.id)}
                        onChange={() => handleCheckboxChange(tenant.id)}
                      />
                    </td>
                    <td className="px-6 py-3">{tenant.fullName || "-"}</td>
                    <td className="px-6 py-3">{tenant.email || "-"}</td>
                    <td className="px-6 py-3">{tenant.phone || "-"}</td>
                    <td className="px-6 py-3">{tenant.gender || "-"}</td>
                    <td className="px-6 py-3">{tenant.room?.name || "-"}</td>
                    <td className="px-6 py-3">
                      {tenant.startDate
                        ? new Date(tenant.startDate).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 p-4 flex justify-center gap-2 bg-white">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg transition ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantsManagement;
