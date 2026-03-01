import { useState, useEffect, useMemo } from "react";
import Loading from "./loading.jsx";
import SearchInput from "./ui/SearchInput.jsx";
import Pagination from "./ui/Pagination.jsx";
import {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../services/api";
import api from "../server/api.js";
import { toast } from "react-hot-toast";

function TenantsManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [roomAssignmentFilter, setRoomAssignmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("unassigned-first");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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
  const [availableRooms, setAvailableRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState("");
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [assigningTenant, setAssigningTenant] = useState(null);
  const [assignRoomSearch, setAssignRoomSearch] = useState("");
  const [assignRoomDropdownOpen, setAssignRoomDropdownOpen] = useState(false);
  const [selectedAssignRoomId, setSelectedAssignRoomId] = useState("");

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

  const fetchAvailableRooms = async () => {
    try {
      setRoomLoading(true);
      const data = await api.get("/api/owner/rooms");
      const normalizedRooms = Array.isArray(data) ? data : [];

      normalizedRooms.sort((firstRoom, secondRoom) => {
        const first = `${firstRoom.houseName || ""} ${firstRoom.name || ""}`;
        const second = `${secondRoom.houseName || ""} ${secondRoom.name || ""}`;
        return first.localeCompare(second);
      });

      const emptyRooms = normalizedRooms.filter((room) => room.status === "EMPTY");

      setAllRooms(normalizedRooms);
      setAvailableRooms(emptyRooms);
    } catch (err) {
      console.error("Failed to fetch available rooms:", err);
      toast.error("Failed to load empty rooms");
      setAllRooms([]);
      setAvailableRooms([]);
    } finally {
      setRoomLoading(false);
    }
  };

  useEffect(() => {
    if (!showForm) return;
    fetchAvailableRooms();
  }, [showForm]);

  useEffect(() => {
    if (!assigningTenant) return;
    fetchAvailableRooms();
  }, [assigningTenant]);

  // Filter, sort & search
  const processedTenants = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();

    return tenants
      .filter((tenant) => {
        const matchesSearch =
          (tenant.fullName || "").toLowerCase().includes(keyword) ||
          (tenant.email || "").toLowerCase().includes(keyword) ||
          (tenant.phone || "").includes(searchTerm);

        const matchesStatus =
          filterStatus === "all" ||
          (tenant.status || "").toLowerCase() === filterStatus.toLowerCase();

        const hasRoom = Boolean(tenant.roomId || tenant.room?.id);
        const matchesRoomAssignment =
          roomAssignmentFilter === "all" ||
          (roomAssignmentFilter === "assigned" && hasRoom) ||
          (roomAssignmentFilter === "unassigned" && !hasRoom);

        return matchesSearch && matchesStatus && matchesRoomAssignment;
      })
      .sort((firstTenant, secondTenant) => {
        switch (sortBy) {
          case "name-asc":
            return (firstTenant.fullName || "").localeCompare(
              secondTenant.fullName || "",
            );
          case "name-desc":
            return (secondTenant.fullName || "").localeCompare(
              firstTenant.fullName || "",
            );
          case "assigned-first": {
            const firstHasRoom = Boolean(firstTenant.roomId || firstTenant.room?.id);
            const secondHasRoom = Boolean(
              secondTenant.roomId || secondTenant.room?.id,
            );
            if (firstHasRoom === secondHasRoom) {
              return (firstTenant.fullName || "").localeCompare(
                secondTenant.fullName || "",
              );
            }
            return firstHasRoom ? -1 : 1;
          }
          case "unassigned-first": {
            const firstHasRoom = Boolean(firstTenant.roomId || firstTenant.room?.id);
            const secondHasRoom = Boolean(
              secondTenant.roomId || secondTenant.room?.id,
            );
            if (firstHasRoom === secondHasRoom) {
              return (firstTenant.fullName || "").localeCompare(
                secondTenant.fullName || "",
              );
            }
            return firstHasRoom ? 1 : -1;
          }
          case "newest":
            return (secondTenant.id || 0) - (firstTenant.id || 0);
          default:
            return 0;
        }
      });
  }, [tenants, searchTerm, filterStatus, roomAssignmentFilter, sortBy]);

  const filteredAvailableRooms = useMemo(() => {
    if (!roomSearch.trim()) return availableRooms;
    const keyword = roomSearch.toLowerCase();

    return availableRooms.filter(
      (room) =>
        (room.name || "").toLowerCase().includes(keyword) ||
        (room.houseName || "").toLowerCase().includes(keyword),
    );
  }, [availableRooms, roomSearch]);

  const filteredAssignAvailableRooms = useMemo(() => {
    if (!assignRoomSearch.trim()) return allRooms;
    const keyword = assignRoomSearch.toLowerCase();

    return allRooms.filter(
      (room) =>
        (room.name || "").toLowerCase().includes(keyword) ||
        (room.houseName || "").toLowerCase().includes(keyword),
    );
  }, [allRooms, assignRoomSearch]);

  const tenantStats = useMemo(() => {
    const assignedRoomCount = tenants.filter((tenant) => tenant.roomId).length;
    const noRoomCount = tenants.length - assignedRoomCount;

    return {
      total: tenants.length,
      assigned: assignedRoomCount,
      unassigned: noRoomCount,
    };
  }, [tenants]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, roomAssignmentFilter, sortBy, itemsPerPage]);

  // Pagination
  const totalPages = Math.ceil(processedTenants.length / itemsPerPage);
  const paginatedTenants = processedTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    setRoomSearch("");
    setRoomDropdownOpen(false);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSelectRoom = (room) => {
    setFormData((prev) => ({ ...prev, roomId: String(room.id) }));
    setRoomSearch(`${room.name}${room.houseName ? ` - ${room.houseName}` : ""}`);
    setRoomDropdownOpen(false);
  };

  const handleOpenAssignRoom = (tenant) => {
    setAssigningTenant(tenant);
    setAssignRoomSearch("");
    setAssignRoomDropdownOpen(false);
    setSelectedAssignRoomId("");
  };

  const resetAssignRoom = () => {
    setAssigningTenant(null);
    setAssignRoomSearch("");
    setAssignRoomDropdownOpen(false);
    setSelectedAssignRoomId("");
  };

  const handleSelectAssignRoom = (room) => {
    setSelectedAssignRoomId(String(room.id));
    setAssignRoomSearch(
      `${room.name}${room.houseName ? ` - ${room.houseName}` : ""}`,
    );
    setAssignRoomDropdownOpen(false);
  };

  const handleAssignRoomForTenant = async () => {
    if (!assigningTenant?.id) {
      toast.error("Tenant is invalid");
      return;
    }

    const roomId = Number(selectedAssignRoomId);
    if (!roomId) {
      toast.error("Please select an empty room");
      return;
    }

    const selectedRoom = allRooms.find((room) => Number(room.id) === roomId);
    if (!selectedRoom || selectedRoom.status !== "EMPTY") {
      toast.error("Selected room is full or unavailable");
      return;
    }

    try {
      await api.post(`/api/owner/rooms/${roomId}/add-tenant`, {
        tenantId: assigningTenant.id,
      });
      toast.success("Room assigned successfully");
      resetAssignRoom();
      fetchTenants();
    } catch (err) {
      console.error("Assign room error:", err);
      toast.error(err.message || "Unable to assign room");
    }
  };

  // Save tenant (create or update)
  const handleSave = async () => {
    try {
      if (!formData.fullName || !formData.email) {
        toast.error("Please fill in required fields: Name, Email");
        return;
      }

      const age = parseInt(formData.age) || 0;
      const roomId = parseInt(formData.roomId);

      // Validate age >= 18
      if (age < 18) {
        toast.error("Age must be at least 18 years old");
        return;
      }

      // Validate roomId >= 1 (create only)
      if (!editingId && roomId < 1) {
        toast.error("Please select an empty room");
        return;
      }

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        age: parseInt(formData.age) || 0,
        startDate: formData.startDate,
        ...(editingId
          ? {}
          : { roomId: formData.roomId ? parseInt(formData.roomId) : null }),
      };

      if (editingId) {
        await updateTenant(editingId, payload);
        toast.success("Tenant updated successfully");
      } else {
        await createTenant(payload);
        toast.success("Tenant created successfully");
      }

      fetchTenants();
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Unable to save tenant");
    }
  };

  // Delete single tenant
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      try {
        await deleteTenant(id);
        toast.success("Tenant deleted successfully");
        fetchTenants();
      } catch (err) {
        console.error("Delete error:", err);
        toast.error(err.message || "Unable to delete tenant");
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
    setRoomSearch("");
    setRoomDropdownOpen(false);
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
      toast.error("Select at least one tenant to delete");
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
        toast.success("Selected tenants deleted successfully");
        fetchTenants();
        setSelectedIds([]);
      } catch (err) {
        console.error("Bulk delete error:", err);
        toast.error(err.message || "Unable to complete bulk delete");
      }
    }
  };

  if (loading) {
    return <Loading isLoading={true} />;
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-6 gap-5">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Tenant Management
        </h1>
        <p className="text-slate-600">Manage tenant profiles and room assignment</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
          <div className="text-xs text-slate-500">Total Tenants</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{tenantStats.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
          <div className="text-xs text-slate-500">Assigned Room</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{tenantStats.assigned}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
          <div className="text-xs text-slate-500">Without Room</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{tenantStats.unassigned}</div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        {/* Search */}
        <SearchInput
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name, email, phone..."
          className="flex-1 min-w-60"
        />

        {/* Filter status */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
          }}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
        </select>

        <select
          value={roomAssignmentFilter}
          onChange={(e) => {
            setRoomAssignmentFilter(e.target.value);
          }}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All room states</option>
          <option value="unassigned">Without room</option>
          <option value="assigned">Assigned room</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
          }}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="unassigned-first">Sort: Without room first</option>
          <option value="assigned-first">Sort: Assigned room first</option>
          <option value="name-asc">Sort: Name A-Z</option>
          <option value="name-desc">Sort: Name Z-A</option>
          <option value="newest">Sort: Newest</option>
        </select>

        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
          }}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value={20}>20 / page</option>
          <option value={30}>30 / page</option>
          <option value={50}>50 / page</option>
        </select>

        {/* Add button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {showForm ? "Cancel" : "+ Add Tenant"}
        </button>

        {/* Bulk delete */}
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Delete ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-1 text-slate-900">
            {editingId ? "Edit Tenant" : "Add New Tenant"}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {editingId
              ? "Update tenant profile information"
              : "Create a tenant and assign to an empty room"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full name */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
                placeholder="Enter name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="0123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="OTHER">Other</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleFormChange}
                placeholder="25"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Room (create only) */}
            {!editingId && (
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Room *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => {
                      setRoomSearch(e.target.value);
                      setFormData((prev) => ({ ...prev, roomId: "" }));
                      setRoomDropdownOpen(true);
                    }}
                    onFocus={() => setRoomDropdownOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setRoomDropdownOpen(false), 150);
                    }}
                    disabled={roomLoading}
                    placeholder="Search empty room by room name or house name..."
                    className="w-full pr-12 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setRoomDropdownOpen((prev) => !prev)}
                    disabled={roomLoading}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    aria-label="Toggle room list"
                  >
                    ▾
                  </button>
                </div>

                {roomDropdownOpen && !roomLoading && filteredAvailableRooms.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {filteredAvailableRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleSelectRoom(room)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-800">{room.name}</div>
                        {room.houseName ? (
                          <div className="text-xs text-slate-500">{room.houseName}</div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}

                {!roomLoading && filteredAvailableRooms.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    No empty rooms found.
                  </p>
                )}
              </div>
            )}

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Form buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Save
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick assign room */}
      {assigningTenant && (
        <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Assign Room</h3>
              <p className="text-sm text-slate-500">
                Assign empty room for <span className="font-medium text-slate-700">{assigningTenant.fullName}</span>
              </p>
            </div>
          </div>

          <div className="relative max-w-xl">
            <input
              type="text"
              value={assignRoomSearch}
              onChange={(e) => {
                setAssignRoomSearch(e.target.value);
                setSelectedAssignRoomId("");
                setAssignRoomDropdownOpen(true);
              }}
              onFocus={() => setAssignRoomDropdownOpen(true)}
              onBlur={() => {
                setTimeout(() => setAssignRoomDropdownOpen(false), 150);
              }}
              disabled={roomLoading}
              placeholder="Search empty room by room name or house name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />

            {assignRoomDropdownOpen && !roomLoading && filteredAssignAvailableRooms.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {filteredAssignAvailableRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleSelectAssignRoom(room)}
                    disabled={room.status !== "EMPTY"}
                    className={`w-full text-left px-4 py-2 border-b border-gray-100 last:border-b-0 ${
                      room.status === "EMPTY"
                        ? "hover:bg-blue-50"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className={`font-medium ${room.status === "EMPTY" ? "text-slate-800" : "text-slate-500"}`}>
                        {room.name}
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          room.status === "EMPTY"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-300 text-slate-700"
                        }`}
                      >
                        {room.status === "EMPTY" ? "Empty" : "Full"}
                      </span>
                    </div>
                    {room.houseName ? (
                      <div className={`text-xs ${room.status === "EMPTY" ? "text-slate-500" : "text-slate-400"}`}>
                        {room.houseName}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            {!roomLoading && filteredAssignAvailableRooms.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">No rooms found.</p>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleAssignRoomForTenant}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Confirm Assign
            </button>
            <button
              onClick={resetAssignRoom}
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table Container - Scrollable */}
      <div className="flex-1 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5 text-left">
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
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Phone</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Gender</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Room</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Start Date
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTenants.length > 0 ? (
                paginatedTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(tenant.id)}
                        onChange={() => handleCheckboxChange(tenant.id)}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{tenant.fullName || "-"}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{tenant.email || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{tenant.phone || "-"}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {tenant.gender || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {tenant.room?.name ? (
                        <div>
                          <div className="font-medium text-slate-800">{tenant.room.name}</div>
                          {tenant.room?.house?.name ? (
                            <div className="text-xs text-slate-500">{tenant.room.house.name}</div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-amber-600 text-sm font-medium">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 text-sm">
                      {tenant.startDate
                        ? new Date(tenant.startDate).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>
                    <td className="px-4 py-2.5 flex gap-2">
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="px-3 py-1.5 border border-blue-200 text-blue-700 text-xs rounded-lg hover:bg-blue-50 transition"
                      >
                        Edit
                      </button>
                      {!tenant.room?.name && (
                        <button
                          onClick={() => handleOpenAssignRoom(tenant)}
                          className="px-3 py-1.5 border border-amber-200 text-amber-700 text-xs rounded-lg hover:bg-amber-50 transition"
                        >
                          Assign Room
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 transition"
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
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No tenants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Fixed at bottom */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 bg-white flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Showing {paginatedTenants.length} / {processedTenants.length} tenants
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantsManagement;
