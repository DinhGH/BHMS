import { useCallback, useEffect, useState } from "react";
import InfoBox from "../components/ui/InfoBox";
import ActionButton from "../components/ui/ActionButton";
import TenantItem from "../components/ui/TenantItem";
import { FaUsers } from "react-icons/fa";
import EditRoomModal from "../components/EditRoomModal";
import AddTenantModal from "../components/AddTenantModal";
import RemoveTenantModal from "../components/RemoveTenantModal";
import {
  getRoomServicesApi,
  removeServiceFromRoomApi,
} from "../server/roomServiceApi";
import AddServiceModal from "./AddServiceModal";
import MakeInvoiceModal from "./MakeInvoiceModal";
import EditInvoiceModal from "./EditInvoiceModal";
import EditServiceQuantityModal from "./EditServiceQuantityModal";
import Loading from "./loading.jsx";
import api from "../server/api";
import { toast } from "react-hot-toast";
import useConfirmDialog from "../hooks/useConfirmDialog";
import {
  getContractDetail,
  updateContract,
  deleteContract,
} from "../services/contractService";

export default function ViewDetailRoom({ roomId, onBack }) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showRemoveTenant, setShowRemoveTenant] = useState(false);
  const [roomServices, setRoomServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [showMakeInvoice, setShowMakeInvoice] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showEditServiceQuantity, setShowEditServiceQuantity] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [contractDetail, setContractDetail] = useState(null);
  const [showContractDetail, setShowContractDetail] = useState(false);
  const [loadingContractDetail, setLoadingContractDetail] = useState(false);
  const [showEditContract, setShowEditContract] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractForm, setContractForm] = useState({
    tenantId: "",
    startDate: "",
    endDate: "",
    terms: "",
  });

  /* ================= FETCH ================= */

  const fetchRoomDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/owner/rooms/${roomId}`);
      setRoom(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load room detail");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const fetchRoomServices = useCallback(async () => {
    try {
      const res = await getRoomServicesApi(roomId);
      setRoomServices(res);
    } catch {
      toast.error("Failed to load services");
    }
  }, [roomId]);

  const fetchRoomInvoices = useCallback(async () => {
    try {
      const res = await api.get(`/api/owner/rooms/${roomId}/invoices`);
      setInvoices(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoices");
      setInvoices([]);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) fetchRoomDetail();
    fetchRoomServices();
    fetchRoomInvoices();
  }, [roomId, fetchRoomDetail, fetchRoomInvoices, fetchRoomServices]);

  const renderInvoiceStatus = (status) => {
    switch (status) {
      case "NO_TENANT":
        return "No tenant rented";
      case "NO_INVOICE":
        return "No invoice created";
      case "PENDING":
        return "Unpaid";
      case "PAID":
        return "Paid";
      case "OVERDUE":
        return "Overdue";
      default:
        return "-";
    }
  };

  const calcElectricCost = () => {
    if (!room) return 0;
    const now = Number(room.electricMeterNow ?? 0);
    const after = Number(room.electricMeterAfter ?? 0);
    const fee = Number(room.electricFee ?? 0);

    if (after < now) return 0;
    return (after - now) * fee;
  };

  const calcWaterCost = () => {
    if (!room) return 0;
    const now = Number(room.waterMeterNow ?? 0);
    const after = Number(room.waterMeterAfter ?? 0);
    const fee = Number(room.waterFee ?? 0);

    if (after < now) return 0;
    return (after - now) * fee;
  };

  const calcServiceCost = () => {
    return roomServices.reduce((sum, s) => {
      const totalPrice = s.totalPrice || Number(s.price) * (s.quantity || 1);
      return sum + totalPrice;
    }, 0);
  };
  const calcTotalCost = () => {
    return (
      Number(room.price ?? 0) +
      calcElectricCost() +
      calcWaterCost() +
      calcServiceCost()
    );
  };

  const formatUsd = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US");
  };

  const toInputDate = (value) => {
    if (!value) return "";
    return String(value).slice(0, 10);
  };

  /* ================= ACTIONS ================= */

  const handleDeleteRoom = async () => {
    if (!room) return;

    const confirmed = await confirm({
      title: "Delete room",
      message: `Are you sure you want to delete room "${room.name}"?\nThis action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      setDeleting(true);
      await api.delete(`/api/owner/rooms/${room.id}`);
      toast.success(`Room "${room.name}" deleted successfully`);
      onBack(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Cannot delete room. Please check room status.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleMakeInvoice = async () => {
    setShowMakeInvoice(true);
  };

  const handleViewContract = async (contractId) => {
    if (!contractId) {
      toast.error("This room has no contract to view");
      return;
    }

    try {
      setShowContractDetail(true);
      setLoadingContractDetail(true);
      const data = await getContractDetail(contractId);
      setContractDetail(data);
    } catch (err) {
      toast.error(err?.message || "Failed to load contract detail");
      setShowContractDetail(false);
    } finally {
      setLoadingContractDetail(false);
    }
  };

  const handleOpenEditContract = (contract) => {
    if (!contract?.id) {
      toast.error("This room has no contract to edit");
      return;
    }

    const fallbackTenantId = room?.tenants?.[0]?.id || "";
    setContractForm({
      tenantId: String(contract.tenantId || fallbackTenantId || ""),
      startDate: toInputDate(contract.startDate || contract.start),
      endDate: toInputDate(contract.endDate || contract.end),
      terms: contract.terms || "",
    });
    setSelectedContract(contract);
    setShowEditContract(true);
  };

  const handleSaveContract = async () => {
    const contract = selectedContract || room?.contract;
    if (!contract?.id) {
      toast.error("This room has no contract to update");
      return;
    }

    if (!contractForm.tenantId || !contractForm.startDate) {
      toast.error("Please select tenant and start date");
      return;
    }

    if (contractForm.endDate && contractForm.endDate < contractForm.startDate) {
      toast.error("End date must be greater than or equal to start date");
      return;
    }

    try {
      setSavingContract(true);
      await updateContract(contract.id, {
        roomId: Number(room.id),
        tenantId: Number(contractForm.tenantId),
        startDate: contractForm.startDate,
        endDate: contractForm.endDate || null,
        terms: contractForm.terms?.trim() || null,
      });
      toast.success("Contract updated successfully");
      setShowEditContract(false);
      setSelectedContract(null);
      await fetchRoomDetail();
    } catch (err) {
      toast.error(err?.message || "Failed to update contract");
    } finally {
      setSavingContract(false);
    }
  };

  const handleDeleteContract = async (contract) => {
    if (!contract?.id) {
      toast.error("This room has no contract to delete");
      return;
    }

    const agreed = await confirm({
      title: "Delete contract",
      message: `Delete contract #${contract.id} for room ${room?.name || "?"}?`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!agreed) return;

    try {
      await deleteContract(contract.id);
      toast.success("Contract deleted successfully");
      setShowContractDetail(false);
      setSelectedContract(null);
      setContractDetail(null);
      await fetchRoomDetail();
    } catch (err) {
      toast.error(err?.message || "Failed to delete contract");
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <Loading isLoading={true} />;
  }

  if (!room) {
    return <div className="text-center py-16 text-red-500">Room not found</div>;
  }

  const isOccupied = room.status === "OCCUPIED";
  const roomStatusText = room.isLocked
    ? "Locked"
    : isOccupied
      ? "Occupied"
      : "Empty";
  const roomStatusStyle = room.isLocked
    ? "bg-amber-100 text-amber-700"
    : isOccupied
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-600";
  const paymentStatusStyle =
    room.paymentStatus === "OVERDUE"
      ? "bg-red-100 text-red-700"
      : room.paymentStatus === "PAID"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-100 text-slate-600";
  const contractHistory =
    Array.isArray(room.contractHistory) && room.contractHistory.length > 0
      ? room.contractHistory
      : room.contract?.id
        ? [room.contract]
        : [];
  const getContractStatusStyle = (status) => {
    if (status === "ACTIVE") return "bg-emerald-100 text-emerald-700";
    if (status === "UPCOMING") return "bg-amber-100 text-amber-700";
    if (status === "EXPIRED") return "bg-slate-100 text-slate-600";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="text-sm px-3 py-1.5 rounded-md border hover:bg-slate-100"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {room.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Room details and operations
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${roomStatusStyle}`}
            >
              {roomStatusText}
            </span>
            <span
              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${paymentStatusStyle}`}
            >
              {renderInvoiceStatus(room.paymentStatus)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">Rent</div>
            <div className="text-lg font-semibold text-slate-900">
              {formatUsd(room.price)}
            </div>
          </div>
          <div className="rounded-lg border bg-blue-50 px-4 py-3">
            <div className="text-xs text-blue-600">Tenants</div>
            <div className="text-lg font-semibold text-blue-900">
              {room.tenants?.length || 0}
            </div>
          </div>
          <div className="rounded-lg border bg-violet-50 px-4 py-3">
            <div className="text-xs text-violet-600">Services Cost</div>
            <div className="text-lg font-semibold text-violet-900">
              {formatUsd(calcServiceCost())}
            </div>
          </div>
          <div className="rounded-lg border bg-emerald-50 px-4 py-3">
            <div className="text-xs text-emerald-600">Est. Total</div>
            <div className="text-lg font-semibold text-emerald-900">
              {formatUsd(calcTotalCost())}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        {/* TOP */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IMAGE */}
          <div className="flex flex-col items-center">
            <div className="w-full h-52 rounded-lg overflow-hidden border bg-slate-100">
              <img
                src={
                  room.imageUrl && room.imageUrl.startsWith("http")
                    ? room.imageUrl
                    : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop"
                }
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-3 font-semibold">{room.name}</div>
          </div>

          {/* INFO */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoBox label="Room Status" value={roomStatusText} />

            <InfoBox
              label="Payment Status"
              value={renderInvoiceStatus(room.paymentStatus)}
            />

            <InfoBox label="Rent" value={`${formatUsd(room.price)} / month`} />

            <InfoBox
              label="Contract Start"
              value={
                room.contract?.start
                  ? new Date(room.contract.start).toLocaleDateString()
                  : "-"
              }
            />

            <InfoBox
              label="Contract End"
              value={
                room.contract?.end
                  ? new Date(room.contract.end).toLocaleDateString()
                  : "-"
              }
            />

            <InfoBox
              label="Electric Cost"
              value={formatUsd(calcElectricCost())}
            />

            <InfoBox label="Water Cost" value={formatUsd(calcWaterCost())} />

            <InfoBox
              label="Service Cost"
              value={formatUsd(calcServiceCost())}
            />

            <InfoBox
              label="Total Estimated Cost"
              value={formatUsd(calcTotalCost())}
            />
          </div>
        </div>

        {/* TENANTS */}
        <div className="border-t pt-6 text-center space-y-4">
          <div className="font-semibold text-sm">Tenants</div>

          {room.tenants && room.tenants.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
              {room.tenants.map((tenant) => (
                <TenantItem key={tenant.id} tenant={tenant} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <FaUsers />
              <div className="italic text-sm">No tenants yet</div>
            </div>
          )}
        </div>
      </div>
      {/* SERVICE SECTION */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Room Services</h3>
          <span className="text-sm text-gray-500">
            Total: {formatUsd(calcServiceCost())}
          </span>
        </div>

        {roomServices.length > 0 ? (
          <div className="space-y-2">
            {roomServices.map((s) => {
              const isUnitBased = s.service.priceType === "UNIT_BASED";
              const totalPrice = s.totalPrice || s.price * (s.quantity || 1);

              return (
                <div
                  key={s.id}
                  className="flex justify-between items-start bg-slate-50 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{s.service.name}</div>
                    </div>

                    {/* Price breakdown */}
                    <div className="text-sm text-gray-600 mt-1">
                      {isUnitBased ? (
                        <>
                          {formatUsd(s.price)} × {s.quantity || 1}{" "}
                          {s.service.unit || "units"}
                          {" = "}
                          <span className="font-semibold text-gray-800">
                            {formatUsd(totalPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {formatUsd(s.price)} / room
                        </span>
                      )}
                    </div>

                    {s.service.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {s.service.description}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isUnitBased && (
                      <button
                        onClick={() => {
                          setServiceToEdit(s);
                          setShowEditServiceQuantity(true);
                        }}
                        className="text-blue-500 text-sm hover:underline px-2 py-1 hover:bg-blue-50 rounded"
                      >
                        Edit Quantity
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Remove service",
                          message: `Remove "${s.service.name}" from this room?`,
                          confirmText: "Remove",
                          variant: "danger",
                        });
                        if (!confirmed) return;

                        try {
                          await removeServiceFromRoomApi(roomId, s.serviceId);
                          toast.success("Service removed successfully");
                          fetchRoomServices();
                        } catch (err) {
                          toast.error(
                            err?.response?.data?.message ||
                              "Failed to remove service",
                          );
                        }
                      }}
                      className="text-red-500 text-sm hover:underline px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total Services Cost */}
            <div className="border-t pt-3 flex justify-between items-center font-semibold">
              <span>Total Services Cost:</span>
              <span className="text-lg text-blue-600">
                {formatUsd(calcServiceCost())}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <div className="italic text-sm">No services added yet</div>
          </div>
        )}
      </div>

      {/* INVOICES SECTION */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Room Invoices</h3>
          <span className="text-sm text-gray-500">
            Total: {invoices.length}
          </span>
        </div>

        {invoices.length > 0 ? (
          <div className="space-y-3 max-h-115 overflow-y-auto pr-1">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    Period: {invoice.month}/{invoice.year}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: <strong>{invoice.status}</strong>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: <strong>{formatUsd(invoice.totalAmount)}</strong>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created at:{" "}
                    {new Date(invoice.createdAt).toLocaleString("en-US")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingInvoice(invoice)}
                    className="px-3 py-2 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: "Delete invoice",
                        message:
                          "Are you sure you want to delete this invoice?",
                        confirmText: "Delete",
                        variant: "danger",
                      });
                      if (!confirmed) return;
                      try {
                        await api.delete(
                          `/api/owner/rooms/${roomId}/invoices/${invoice.id}`,
                        );
                        toast.success("Invoice deleted successfully");
                        fetchRoomInvoices();
                      } catch (err) {
                        toast.error(
                          err?.response?.data?.message ||
                            "Failed to delete invoice",
                        );
                      }
                    }}
                    className="px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">🧾</div>
            <div className="italic text-sm">No invoices yet</div>
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Room Contract</h4>
            <div className="text-xs text-gray-500">
              {contractHistory.length > 0
                ? `${contractHistory.length} contract(s)`
                : "No contract"}
            </div>
          </div>

          {contractHistory.length > 0 ? (
            <div className="space-y-3 max-h-120 overflow-y-auto pr-1">
              {contractHistory.map((contract) => (
                <div
                  key={contract.id}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-800">
                      Contract #{contract.id}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getContractStatusStyle(contract.status)}`}
                    >
                      {contract.status || "-"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Start Date</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(contract.startDate || contract.start)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">End Date</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(contract.endDate || contract.end)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Tenant</div>
                      <div className="font-medium text-gray-900">
                        {contract.tenant?.fullName || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Tenant Email</div>
                      <div className="font-medium text-gray-900 break-all">
                        {contract.tenant?.email || "-"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Terms</div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {contract.terms || "No terms"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => handleViewContract(contract.id)}
                      className="px-3 py-2 rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenEditContract(contract)}
                      className="px-3 py-2 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteContract(contract)}
                      className="px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No contract found for this room.
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap justify-center gap-3">
          {/* Make Invoice */}
          <ActionButton
            label="Make Invoice"
            variant="success"
            disabled={!isOccupied}
            onClick={handleMakeInvoice}
          />
          {/* Add Services */}
          <ActionButton
            label="Add Services"
            variant="info"
            onClick={() => setShowAddService(true)}
          />
          {showAddService && (
            <AddServiceModal
              roomId={room.id}
              onClose={() => setShowAddService(false)}
              onAdded={fetchRoomServices}
            />
          )}

          {/* ADD TENANT */}
          <>
            <ActionButton
              label="Add Tenant"
              variant="success"
              onClick={() => setShowAddTenant(true)}
            />
            {showAddTenant && (
              <AddTenantModal
                open={showAddTenant}
                roomId={room.id}
                onClose={() => setShowAddTenant(false)}
                onAdded={fetchRoomDetail}
              />
            )}
          </>

          {/* REMOVE TENANT */}
          <>
            <ActionButton
              label="Remove Tenant"
              variant="warning"
              disabled={!room.tenants || room.tenants.length === 0}
              onClick={() => setShowRemoveTenant(true)}
            />
            {showRemoveTenant && (
              <RemoveTenantModal
                open={showRemoveTenant}
                roomId={room.id}
                roomTenants={room.tenants || []}
                onClose={() => setShowRemoveTenant(false)}
                onRemoved={fetchRoomDetail}
              />
            )}
          </>

          <ActionButton
            label="Edit"
            variant="info"
            onClick={() => setShowEdit(true)}
          />

          <ActionButton
            label={deleting ? "Deleting..." : "Delete"}
            variant="danger"
            disabled={deleting}
            onClick={handleDeleteRoom}
          />
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEdit && (
        <EditRoomModal
          open={showEdit}
          room={room}
          onClose={() => setShowEdit(false)}
          onUpdated={fetchRoomDetail}
        />
      )}

      {showMakeInvoice && (
        <MakeInvoiceModal
          room={room}
          onClose={() => setShowMakeInvoice(false)}
          onCreated={() => {
            fetchRoomDetail();
            fetchRoomInvoices();
          }}
        />
      )}

      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          roomId={room.id}
          room={room}
          onClose={() => setEditingInvoice(null)}
          onUpdated={() => {
            fetchRoomInvoices();
            fetchRoomDetail();
          }}
        />
      )}

      {showContractDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => {
              setShowContractDetail(false);
              setContractDetail(null);
            }}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Contract Detail
              </h3>
              <button
                onClick={() => {
                  setShowContractDetail(false);
                  setContractDetail(null);
                }}
                className="w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {loadingContractDetail ? (
                <div className="text-sm text-gray-500">
                  Loading contract detail...
                </div>
              ) : contractDetail ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Contract ID</div>
                    <div className="font-medium text-gray-900">
                      #{contractDetail.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="font-medium text-gray-900">
                      {contractDetail.status || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Room</div>
                    <div className="font-medium text-gray-900">
                      {contractDetail.room?.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Tenant</div>
                    <div className="font-medium text-gray-900">
                      {contractDetail.tenant?.fullName || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Start Date</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(contractDetail.startDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">End Date</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(contractDetail.endDate)}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-gray-500">Terms</div>
                    <div className="font-medium text-gray-900 whitespace-pre-wrap">
                      {contractDetail.terms || "No terms"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No contract detail found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => !savingContract && setShowEditContract(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Contract
              </h3>
              <button
                onClick={() => !savingContract && setShowEditContract(false)}
                disabled={savingContract}
                className="w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant
                </label>
                <select
                  value={contractForm.tenantId}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      tenantId: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select tenant</option>
                  {(room.tenants || []).map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.fullName}{" "}
                      {tenant.email ? `(${tenant.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={contractForm.startDate}
                    onChange={(e) =>
                      setContractForm((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={contractForm.endDate}
                    onChange={(e) =>
                      setContractForm((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms
                </label>
                <textarea
                  value={contractForm.terms}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      terms: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter contract terms"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditContract(false);
                  setSelectedContract(null);
                }}
                disabled={savingContract}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveContract}
                disabled={savingContract}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingContract ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditServiceQuantityModal
        isOpen={showEditServiceQuantity}
        onClose={() => {
          setShowEditServiceQuantity(false);
          setServiceToEdit(null);
        }}
        roomId={roomId}
        service={serviceToEdit}
        onSuccess={fetchRoomServices}
      />

      {confirmDialog}
    </div>
  );
}
