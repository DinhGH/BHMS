import { useCallback, useEffect, useMemo, useState } from "react";
import SearchInput from "./ui/SearchInput.jsx";
import Pagination from "./ui/Pagination.jsx";
import {
  getContracts,
  getContractDetail,
  getContractInvoices,
  getContractStayHistory,
  getContractOptions,
  createContract,
  updateContract,
  deleteContract,
} from "../services/contractService";
import api from "../server/api.js";

const defaultForm = {
  houseId: "",
  roomId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  terms: "",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

const statusClassName = (status) => {
  if (status === "ACTIVE") return "bg-blue-100 text-blue-800";
  if (status === "EXPIRED") return "bg-red-100 text-red-800";
  if (status === "UPCOMING") return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-700";
};

function Modal({ open, title, onClose, children, maxWidth = "max-w-2xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div
        className={`w-full ${maxWidth} bg-white sm:rounded-xl shadow-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden`}
      >
        <div className="px-4 sm:px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="text-gray-400 hover:text-gray-700"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const [contractDetail, setContractDetail] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [openInvoices, setOpenInvoices] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceContract, setInvoiceContract] = useState(null);

  const [openStayHistory, setOpenStayHistory] = useState(false);
  const [loadingStayHistory, setLoadingStayHistory] = useState(false);
  const [stayHistory, setStayHistory] = useState({
    tenantHistory: [],
    roomHistory: [],
  });
  const [stayHistoryContract, setStayHistoryContract] = useState(null);

  const pageSize = 8;

  const loadContractList = useCallback(async () => {
    try {
      setLoading(true);
      const contractData = await getContracts();
      setContracts(Array.isArray(contractData) ? contractData : []);
    } catch (err) {
      setError(err?.message || "Unable to load contract data");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptionsFallback = useCallback(async () => {
    const houses = await api.get("/api/owner/boarding-houses");
    const safeHouses = Array.isArray(houses) ? houses : [];

    const roomLists = await Promise.all(
      safeHouses.map((house) =>
        api.get(`/api/owner/boarding-houses/${house.id}/rooms`).catch(() => []),
      ),
    );

    const roomOptions = roomLists.flatMap((list, index) => {
      const source = Array.isArray(list) ? list : [];
      const house = safeHouses[index];
      return source.map((room) => ({
        id: room.id,
        name: room.name,
        houseId: house?.id ?? null,
        boardingHouseName: house?.name || null,
      }));
    });

    const tenants = await api.get("/api/tenants").catch(() => []);
    const tenantOptions = (Array.isArray(tenants) ? tenants : [])
      .filter((tenant) => tenant.roomId)
      .map((tenant) => ({
        id: tenant.id,
        fullName: tenant.fullName,
        email: tenant.email,
        phone: tenant.phone,
        roomId: tenant.roomId,
        roomName: null,
      }));

    return { roomOptions, tenantOptions };
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);
      setOptionsError("");
      const optionData = await getContractOptions();
      setRooms(Array.isArray(optionData?.rooms) ? optionData.rooms : []);
      setTenants(Array.isArray(optionData?.tenants) ? optionData.tenants : []);
    } catch (err) {
      try {
        const fallback = await loadOptionsFallback();
        setRooms(fallback.roomOptions);
        setTenants(fallback.tenantOptions);
        setOptionsError(
          "Unable to load options from contracts API, using fallback data.",
        );
      } catch {
        setOptionsError(
          err?.message || "Unable to load room/tenant list from server.",
        );
        setRooms([]);
        setTenants([]);
      }
    } finally {
      setOptionsLoading(false);
    }
  }, [loadOptionsFallback]);

  const loadData = useCallback(async () => {
    setError("");
    await Promise.allSettled([loadContractList(), loadOptions()]);
  }, [loadContractList, loadOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredContracts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return contracts.filter((item) => {
      const matchedFilter =
        filter === "all" ||
        (filter === "active" && item.status === "ACTIVE") ||
        (filter === "expired" && item.status === "EXPIRED") ||
        (filter === "no_end_date" && item.hasNoEndDate === true);

      if (!matchedFilter) return false;
      if (!keyword) return true;

      const source = [
        String(item.id),
        item.room?.name,
        item.room?.boardingHouseName,
        item.tenant?.fullName,
        item.tenant?.email,
        item.terms,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return source.includes(keyword);
    });
  }, [contracts, search, filter]);

  const totalPages = Math.ceil(filteredContracts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedContracts = filteredContracts.slice(
    startIndex,
    startIndex + pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const tenantOptionsByRoom = useMemo(() => {
    if (!form.roomId) return [];
    return tenants.filter(
      (tenant) => String(tenant.roomId) === String(form.roomId),
    );
  }, [tenants, form.roomId]);

  const boardingHouseOptions = useMemo(() => {
    const unique = new Map();
    rooms.forEach((room) => {
      if (!room.houseId) return;
      if (!unique.has(String(room.houseId))) {
        unique.set(String(room.houseId), {
          id: String(room.houseId),
          name: room.boardingHouseName || `Boarding House #${room.houseId}`,
        });
      }
    });
    return Array.from(unique.values());
  }, [rooms]);

  const roomOptionsByHouse = useMemo(() => {
    if (!form.houseId) return rooms;
    return rooms.filter(
      (room) => String(room.houseId) === String(form.houseId),
    );
  }, [rooms, form.houseId]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setOpenForm(false);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setOpenForm(true);
  };

  const handleOpenEdit = (contract) => {
    setEditingId(contract.id);
    setForm({
      houseId: String(contract.room?.houseId || ""),
      roomId: String(contract.roomId || ""),
      tenantId: String(contract.tenantId || ""),
      startDate: contract.startDate
        ? String(contract.startDate).slice(0, 10)
        : "",
      endDate: contract.endDate ? String(contract.endDate).slice(0, 10) : "",
      terms: contract.terms || "",
    });
    setOpenForm(true);
  };

  const handleSave = async () => {
    if (!form.roomId || !form.tenantId || !form.startDate) {
      alert("Please provide Room, Tenant, and Start Date");
      return;
    }

    if (form.endDate && form.endDate < form.startDate) {
      alert("End Date must be greater than or equal to Start Date");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        roomId: Number(form.roomId),
        tenantId: Number(form.tenantId),
        startDate: form.startDate,
        endDate: form.endDate || null,
        terms: form.terms?.trim() || null,
      };

      if (editingId) {
        await updateContract(editingId, payload);
      } else {
        await createContract(payload);
      }

      await loadData();
      resetForm();
    } catch (err) {
      alert(err?.message || "Unable to save contract");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contract) => {
    const agreed = window.confirm(
      `Delete contract #${contract.id} for room ${contract.room?.name || "?"}?`,
    );
    if (!agreed) return;

    try {
      await deleteContract(contract.id);
      await loadData();
    } catch (err) {
      alert(err?.message || "Unable to delete contract");
    }
  };

  const handleOpenDetail = async (contractId) => {
    try {
      setOpenDetail(true);
      setLoadingDetail(true);
      const data = await getContractDetail(contractId);
      setContractDetail(data);
    } catch (err) {
      alert(err?.message || "Unable to load contract detail");
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenInvoices = async (contract) => {
    try {
      setOpenInvoices(true);
      setInvoiceContract(contract);
      setLoadingInvoices(true);
      const data = await getContractInvoices(contract.id);
      setInvoiceHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.message || "Unable to load invoice history");
      setOpenInvoices(false);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleOpenStayHistory = async (contract) => {
    try {
      setOpenStayHistory(true);
      setStayHistoryContract(contract);
      setLoadingStayHistory(true);
      const data = await getContractStayHistory(contract.id);
      setStayHistory({
        tenantHistory: Array.isArray(data?.tenantHistory)
          ? data.tenantHistory
          : [],
        roomHistory: Array.isArray(data?.roomHistory) ? data.roomHistory : [],
      });
    } catch (err) {
      alert(err?.message || "Unable to load stay history");
      setOpenStayHistory(false);
    } finally {
      setLoadingStayHistory(false);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Contract Management
          </h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold shadow-md transition w-full sm:w-auto"
            onClick={handleOpenAdd}
            type="button"
          >
            + Add New Contract
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="w-full overflow-x-auto">
            <div className="inline-flex min-w-max items-center gap-2 p-1 bg-gray-100 rounded-lg">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["expired", "Expired"],
                ["no_end_date", "No End Date"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    filter === key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-64 shrink-0">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-300 text-red-700 bg-red-50">
            {error}
          </div>
        )}

        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <div className="max-h-[calc(100vh-230px)] sm:max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm min-w-245">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3">Contract</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-gray-500"
                      colSpan={7}
                    >
                      Loading contracts...
                    </td>
                  </tr>
                ) : paginatedContracts.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-gray-500"
                      colSpan={7}
                    >
                      No contracts found
                    </td>
                  </tr>
                ) : (
                  paginatedContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b last:border-none hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">#{contract.id}</div>
                        <div className="text-xs text-gray-400">
                          Created: {formatDate(contract.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {contract.room?.name || "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {contract.room?.boardingHouseName || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {contract.tenant?.fullName || "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {contract.tenant?.email || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(contract.startDate)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(contract.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClassName(
                            contract.status,
                          )}`}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <button
                            className="px-3 py-1 rounded bg-indigo-600 text-white text-xs"
                            onClick={() => handleOpenDetail(contract.id)}
                            type="button"
                          >
                            Detail
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-emerald-600 text-white text-xs"
                            onClick={() => handleOpenInvoices(contract)}
                            type="button"
                          >
                            Invoices
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-violet-600 text-white text-xs"
                            onClick={() => handleOpenStayHistory(contract)}
                            type="button"
                          >
                            Stay History
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-blue-500 text-white text-xs"
                            onClick={() => handleOpenEdit(contract)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-red-500 text-white text-xs"
                            onClick={() => handleDelete(contract)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(totalPages, 1)}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        open={openForm}
        title={editingId ? "Edit Contract" : "Add New Contract"}
        onClose={resetForm}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Boarding House *
            </label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={form.houseId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  houseId: e.target.value,
                  roomId: "",
                  tenantId: "",
                }))
              }
            >
              <option value="" disabled={optionsLoading}>
                {optionsLoading
                  ? "Loading boarding houses..."
                  : "Select boarding house"}
              </option>
              {boardingHouseOptions.map((house, index) => (
                <option key={`house-${house.id}-${index}`} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Room *</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={form.roomId}
              onChange={(e) => {
                const selectedRoom = roomOptionsByHouse.find(
                  (room) => String(room.id) === String(e.target.value),
                );

                setForm((prev) => ({
                  ...prev,
                  houseId: selectedRoom?.houseId
                    ? String(selectedRoom.houseId)
                    : prev.houseId,
                  roomId: e.target.value,
                  tenantId: "",
                }));
              }}
            >
              <option value="" disabled={optionsLoading}>
                {optionsLoading ? "Loading rooms..." : "Select room"}
              </option>
              {roomOptionsByHouse.map((room, index) => (
                <option key={`room-${room.id}-${index}`} value={room.id}>
                  {room.name} - {room.boardingHouseName || "N/A"}
                </option>
              ))}
            </select>
            {!optionsLoading && roomOptionsByHouse.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No available rooms. Please check owner room data.
              </p>
            )}
            {optionsError && (
              <p className="mt-1 text-xs text-red-600">{optionsError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tenant *</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={form.tenantId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tenantId: e.target.value,
                }))
              }
            >
              <option value="">Select tenant</option>
              {tenantOptionsByRoom.map((tenant, index) => (
                <option key={`tenant-${tenant.id}-${index}`} value={tenant.id}>
                  {tenant.fullName} ({tenant.email})
                </option>
              ))}
            </select>
            {!!form.roomId && tenantOptionsByRoom.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                This room has no tenant available for contract creation.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date *
            </label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2"
              value={form.startDate}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2"
              value={form.endDate}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Terms</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 min-h-28"
              placeholder="Enter contract terms"
              value={form.terms}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  terms: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-md border border-gray-300"
            onClick={resetForm}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
            type="button"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <Modal
        open={openDetail}
        title={
          contractDetail
            ? `Contract Detail #${contractDetail.id}`
            : "Contract Detail"
        }
        onClose={() => {
          setOpenDetail(false);
          setContractDetail(null);
        }}
      >
        {loadingDetail ? (
          <p className="text-gray-500">Loading detail...</p>
        ) : contractDetail ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p>
              <span className="font-semibold">Contract ID:</span> #
              {contractDetail.id}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {contractDetail.status}
            </p>
            <p>
              <span className="font-semibold">Room ID:</span>{" "}
              {contractDetail.roomId}
            </p>
            <p>
              <span className="font-semibold">Tenant ID:</span>{" "}
              {contractDetail.tenantId}
            </p>
            <p>
              <span className="font-semibold">Room Name:</span>{" "}
              {contractDetail.room?.name || "-"}
            </p>
            <p>
              <span className="font-semibold">Boarding House:</span>{" "}
              {contractDetail.room?.boardingHouseName || "-"}
            </p>
            <p>
              <span className="font-semibold">Tenant Name:</span>{" "}
              {contractDetail.tenant?.fullName || "-"}
            </p>
            <p>
              <span className="font-semibold">Tenant Email:</span>{" "}
              {contractDetail.tenant?.email || "-"}
            </p>
            <p>
              <span className="font-semibold">Start Date:</span>{" "}
              {formatDate(contractDetail.startDate)}
            </p>
            <p>
              <span className="font-semibold">End Date:</span>{" "}
              {formatDate(contractDetail.endDate)}
            </p>
            <p>
              <span className="font-semibold">Created At:</span>{" "}
              {formatDate(contractDetail.createdAt)}
            </p>
            <p>
              <span className="font-semibold">Invoices:</span>{" "}
              {Array.isArray(contractDetail.invoiceHistory)
                ? contractDetail.invoiceHistory.length
                : 0}
            </p>
            <div className="md:col-span-2">
              <p className="font-semibold mb-1">Terms</p>
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 whitespace-pre-wrap">
                {contractDetail.terms || "No terms"}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No data available.</p>
        )}
      </Modal>

      <Modal
        open={openInvoices}
        title={
          invoiceContract
            ? `Invoice History - Contract #${invoiceContract.id}`
            : "Invoice History"
        }
        onClose={() => {
          setOpenInvoices(false);
          setInvoiceHistory([]);
          setInvoiceContract(null);
        }}
        maxWidth="max-w-4xl"
      >
        {loadingInvoices ? (
          <p className="text-gray-500">Loading invoices...</p>
        ) : invoiceHistory.length === 0 ? (
          <p className="text-gray-500">No invoices found for this contract.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-190">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3">Invoice</th>
                  <th className="py-2 pr-3">Month/Year</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Created At</th>
                  <th className="py-2 pr-3">Payment Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {invoiceHistory.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-none">
                    <td className="py-2 pr-3">#{invoice.id}</td>
                    <td className="py-2 pr-3">
                      {invoice.month}/{invoice.year}
                    </td>
                    <td className="py-2 pr-3">
                      {Number(invoice.totalAmount || 0).toLocaleString("vi-VN")}{" "}
                      VND
                    </td>
                    <td className="py-2 pr-3">{invoice.status}</td>
                    <td className="py-2 pr-3">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="py-2 pr-3">
                      {Array.isArray(invoice.payment) &&
                      invoice.payment.some((payment) => payment.confirmed)
                        ? "Yes"
                        : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal
        open={openStayHistory}
        title={
          stayHistoryContract
            ? `Stay History - Contract #${stayHistoryContract.id}`
            : "Stay History"
        }
        onClose={() => {
          setOpenStayHistory(false);
          setStayHistory({ tenantHistory: [], roomHistory: [] });
          setStayHistoryContract(null);
        }}
        maxWidth="max-w-5xl"
      >
        {loadingStayHistory ? (
          <p className="text-gray-500">Loading stay history...</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Stay History by Tenant ({stayHistory.tenantHistory.length})
              </h4>
              {stayHistory.tenantHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No history available.</p>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full min-w-190 text-sm">
                    <thead className="bg-gray-50 border-b text-left text-gray-500">
                      <tr>
                        <th className="py-2 px-3">Contract</th>
                        <th className="py-2 px-3">Room</th>
                        <th className="py-2 px-3">Start</th>
                        <th className="py-2 px-3">End</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stayHistory.tenantHistory.map((item) => (
                        <tr
                          key={`tenant-${item.id}`}
                          className="border-b last:border-none"
                        >
                          <td className="py-2 px-3">#{item.id}</td>
                          <td className="py-2 px-3">
                            {item.room?.name || "-"} (
                            {item.room?.boardingHouseName || "-"})
                          </td>
                          <td className="py-2 px-3">
                            {formatDate(item.startDate)}
                          </td>
                          <td className="py-2 px-3">
                            {formatDate(item.endDate)}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClassName(
                                item.status,
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">
                Stay History by Room ({stayHistory.roomHistory.length})
              </h4>
              {stayHistory.roomHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No history available.</p>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full min-w-190 text-sm">
                    <thead className="bg-gray-50 border-b text-left text-gray-500">
                      <tr>
                        <th className="py-2 px-3">Contract</th>
                        <th className="py-2 px-3">Tenant</th>
                        <th className="py-2 px-3">Start</th>
                        <th className="py-2 px-3">End</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stayHistory.roomHistory.map((item) => (
                        <tr
                          key={`room-${item.id}`}
                          className="border-b last:border-none"
                        >
                          <td className="py-2 px-3">#{item.id}</td>
                          <td className="py-2 px-3">
                            {item.tenant?.fullName || "-"} (
                            {item.tenant?.email || "-"})
                          </td>
                          <td className="py-2 px-3">
                            {formatDate(item.startDate)}
                          </td>
                          <td className="py-2 px-3">
                            {formatDate(item.endDate)}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClassName(
                                item.status,
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ContractManagement;
