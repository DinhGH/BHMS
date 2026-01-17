import { useEffect, useState } from "react";
import InfoBox from "../components/ui/InfoBox";
import ActionButton from "../components/ui/ActionButton";
import TenantItem from "../components/ui/TenantItem";
import { FaUsers } from "react-icons/fa";
import api from "../server/api";

export default function ViewDetailRoom({ roomId, onBack }) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16">Loading...</div>;
  if (!room)
    return <div className="text-center py-16 text-red-500">Room not found</div>;
  const isOccupied = !!room.tenant;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-sm px-3 py-1 rounded-md border hover:bg-slate-100 transition"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold text-slate-900">Room Details</h2>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Top */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image */}
          <div className="flex flex-col items-center">
            <div className="w-full h-52 rounded-lg overflow-hidden bg-slate-100 border">
              <img
                src={room.image || "/no-image.png"}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-800">
              {room.name}
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoBox label="Payment Status" value={room.paymentStatus} />
            <InfoBox label="Rent" value={`${room.price}$/Month`} />
            <InfoBox
              label="Move-in Date"
              value={
                room.moveInDate
                  ? new Date(room.moveInDate).toLocaleDateString()
                  : "-"
              }
            />

            <InfoBox
              label="Contract Ends"
              value={
                room.contractEnd
                  ? new Date(room.contractEnd).toLocaleDateString()
                  : "-"
              }
            />

            <InfoBox
              label="Room Status"
              value={
                room.isLocked ? "Locked" : isOccupied ? "Occupied" : "Empty"
              }
            />

            <InfoBox label="Room Type" value="Studio" />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t pt-6" />

        {/* Tenants */}
        <div className="text-center space-y-4">
          <div className="text-sm font-semibold text-slate-700">Tenants</div>

          {room.tenant ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
              <TenantItem tenant={room.tenant} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <FaUsers />
              <div className="text-sm italic">Hiện chưa có người thuê</div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col-3 justify-center gap-4   ">
        <ActionButton label="Make Invoice" />
        <ActionButton label="Edit" />
        <ActionButton label="Delete" danger />
      </div>
    </div>
  );
}
