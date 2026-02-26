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

  /* ================= UI ================= */

  if (loading) {
    return <Loading isLoading={true} />;
  }

  if (!room) {
    return <div className="text-center py-16 text-red-500">Room not found</div>;
  }

  const isOccupied = room.status === "OCCUPIED";

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm px-3 py-1 rounded-md border hover:bg-slate-100"
        >
          ← Back
        </button>
        <h2 className="text-xl font-semibold">Room Details</h2>
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
            <InfoBox
              label="Room Status"
              value={
                room.isLocked ? "Locked" : isOccupied ? "Occupied" : "Empty"
              }
            />

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
          <h3 className="font-semibold">Room Services</h3>
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
          <h3 className="font-semibold">Room Invoices</h3>
          <span className="text-sm text-gray-500">
            Total: {invoices.length}
          </span>
        </div>

        {invoices.length > 0 ? (
          <div className="space-y-3">
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
      </div>

      {/* ACTIONS */}
      <div className="flex justify-center gap-4">
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
