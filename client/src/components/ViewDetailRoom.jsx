import { useEffect, useState } from "react";
import InfoBox from "../components/ui/InfoBox";
import ActionButton from "../components/ui/ActionButton";
import TenantItem from "../components/ui/TenantItem";
import { FaUsers } from "react-icons/fa";
import EditRoomModal from "../components/EditRoomModal";
import AddTenantModal from "../components/AddTenantModal";
import RemoveTenantModal from "../components/RemoveTenantModal";
import api from "../server/api";
import { toast } from "react-hot-toast";

export default function ViewDetailRoom({ roomId, onBack }) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showRemoveTenant, setShowRemoveTenant] = useState(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    if (roomId) fetchRoomDetail();
  }, [roomId]);

  const fetchRoomDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/owner/rooms/${roomId}`);
      setRoom(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load room detail");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UTIL ================= */

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

  const calcTotalCost = () => {
    return Number(room.price ?? 0) + calcElectricCost() + calcWaterCost();
  };

  /* ================= ACTIONS ================= */

  const handleDeleteRoom = async () => {
    if (!room) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete room "${room.name}"?\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await api.delete(`/owner/rooms/${room.id}`);
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
    try {
      await api.post(`/owner/rooms/${room.id}/invoice`);
      toast.success("Invoice created successfully");
      fetchRoomDetail();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create invoice");
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <div className="text-center py-16">Loading...</div>;
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
                src={room.imageUrl || "/no-image.png"}
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

            <InfoBox label="Rent" value={`${room.price}$ / month`} />

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
              value={`${calcElectricCost().toLocaleString()}$`}
            />

            <InfoBox
              label="Water Cost"
              value={`${calcWaterCost().toLocaleString()}$`}
            />

            <InfoBox
              label="Total Estimated Cost"
              value={`${calcTotalCost().toLocaleString()}$`}
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
              <div className="italic text-sm">Chưa có người thuê</div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-center gap-4">
        <ActionButton
          label="Make Invoice"
          className="hover:bg-green-600"
          disabled={!isOccupied}
          onClick={handleMakeInvoice}
        />
        {/* ADD TENANT */}
        <>
          <ActionButton
            label="Add Tenant"
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
            danger
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

        <ActionButton label="Edit" onClick={() => setShowEdit(true)} />

        <ActionButton
          label={deleting ? "Deleting..." : "Delete"}
          danger
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
    </div>
  );
}
