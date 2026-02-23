import { useState, useEffect } from "react";
import {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../services/api";

function TenantsManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
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

  // Fetch tenants
  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await getTenants();
      setTenants(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
      setError(err.message || "Failed to load tenants");
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

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form
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
    setEditingId(null);
    setShowForm(false);
  };

  // Save tenant (create or update)
  const handleSave = async () => {
    try {
      if (!formData.fullName || !formData.email) {
        alert("Please fill in required fields: Name, Email");
        return;
      }

      const age = parseInt(formData.age) || 0;
      const roomId = parseInt(formData.roomId);

      // Validate age >= 18
      if (age < 18) {
        alert("Age must be at least 18 years old");
        return;
      }

      // Validate roomId >= 1
      if (roomId < 1) {
        alert("Please select a valid room");
        return;
      }

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        age: parseInt(formData.age) || 0,
        roomId: formData.roomId ? parseInt(formData.roomId) : null,
        startDate: formData.startDate,
      };

      if (editingId) {
        await updateTenant(editingId, payload);
        alert("Tenant updated successfully");
      } else {
        await createTenant(payload);
        alert("Tenant created successfully");
      }

      fetchTenants();
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      alert("Error: " + (err.message || "Unable to save data"));
    }
  };

  // Delete single tenant
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      try {
        await deleteTenant(id);
        alert("Deleted successfully");
        fetchTenants();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Error: " + (err.message || "Unable to delete"));
      }
    }
  };

  // Edit tenant
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
    setEditingId(tenant.id);
    setShowForm(true);
  };

  // Toggle checkbox
  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select at least one tenant to delete");
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
        alert("Deleted successfully");
        fetchTenants();
        setSelectedIds([]);
      } catch (err) {
        console.error("Bulk delete error:", err);
        alert("Error: " + (err.message || "Unable to delete"));
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-center text-gray-500">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Tenant Management
        </h1>
        <p className="text-gray-600">List of all tenants</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        {/* Search */}
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

        {/* Filter status */}
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

        {/* Add button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? "Cancel" : "+ Add Tenant"}
        </button>

        {/* Bulk delete */}
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
              <label className="block text-sm font-semibold mb-1">Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
                placeholder="Enter name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Start date */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form buttons */}
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

      {/* Table Container - Scrollable */}
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

        {/* Pagination - Fixed at bottom */}
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
