import { useEffect, useState } from "react";
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
} from "../services/roomServiceApi";
import { getRoomDetail, deleteRoom } from "../services/boardingHouse";
import EditQuantityModal from "../components/EditQuantityModal";
import AddServiceModal from "./AddServiceModal";
import MakeInvoiceModal from "./MakeInvoiceModal";
import EditInvoiceModal from "./EditInvoiceModal";
import EditServiceQuantityModal from "./EditServiceQuantityModal";
import Loading from "./loading.jsx";
// import api from "../server/api";

import { toast } from "react-hot-toast";
import InvoicePreviewModal from "./InvoicePreviewModal";

export default function ViewDetailRoom({ roomId, onBack }) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showRemoveTenant, setShowRemoveTenant] = useState(false);
  const [roomServices, setRoomServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [showEditQuantity, setShowEditQuantity] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [openInvoice, setOpenInvoice] = useState(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    if (roomId) fetchRoomDetail();
    fetchRoomServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const fetchRoomDetail = async () => {
    try {
      setLoading(true);
      const res = await getRoomDetail(roomId);
      setRoom(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load room detail");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomServices = async () => {
    try {
      const res = await getRoomServicesApi(roomId);
      setRoomServices(res);
    } catch {
      toast.error("Failed to load services");
    }
  };

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

  /* ================= ACTIONS ================= */

  const handleDeleteRoom = async () => {
    if (!room) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete room "${room.name}"?\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteRoom(room.id);
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
              label="Service Cost"
              value={`${calcServiceCost().toLocaleString()}$`}
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
                          {Number(s.price).toLocaleString()}$ ×{" "}
                          {s.quantity || 1} {s.service.unit || "units"}
                          {" = "}
                          <span className="font-semibold text-gray-800">
                            {totalPrice.toLocaleString()}$
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {Number(s.price).toLocaleString()}$ / room
                        </span>
                      )}
                    </div>

                    {s.service.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {s.service.description}
                      </div>
                    )}
                  </div>
                  {/* Edit Quantity */}
                  <div className="flex gap-2">
                    {isUnitBased && (
                      <button
                        onClick={() => {
                          setEditingService(s);
                          setShowEditQuantity(true);
                        }}
                        className="text-blue-500 text-sm hover:underline px-2 py-1 hover:bg-blue-50 rounded"
                      >
                        Edit Quantity
                      </button>
                    )}
                    {showEditQuantity && editingService && (
                      <EditQuantityModal
                        service={editingService}
                        roomId={room.id}
                        onClose={() => setShowEditQuantity(false)}
                        onUpdated={fetchRoomServices}
                      />
                    )}
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Remove "${s.service.name}" from this room?`,
                        );
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
                {calcServiceCost().toLocaleString()}đ
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

      {/* ACTIONS */}
      <div className="flex justify-center gap-4">
        {/* Make Invoice */}
        <ActionButton
          label="Make Invoice"
          variant="success"
          disabled={!isOccupied}
          onClick={() => setOpenInvoice(true)}
        />
        <InvoicePreviewModal
          room={room}
          open={openInvoice}
          onClose={() => setOpenInvoice(false)}
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
          label="Edit Contract"
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
    </div>
  );
}
