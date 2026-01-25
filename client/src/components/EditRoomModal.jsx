import { useEffect, useState } from "react";
import api from "../server/api";
import { toast } from "react-hot-toast";

export default function EditRoomModal({ open, room, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    electricMeterNow: "",
    electricMeterAfter: "",
    waterMeterNow: "",
    waterMeterAfter: "",
    contractStart: "",
    contractEnd: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (room) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: room.name || "",
        price: room.price || "",
        electricMeterNow: room.electricMeterNow || "",
        electricMeterAfter: room.electricMeterAfter || "",
        waterMeterNow: room.waterMeterNow || "",
        waterMeterAfter: room.waterMeterAfter || "",
        contractStart: room.contractStart
          ? room.contractStart.slice(0, 10)
          : "",
        contractEnd: room.contractEnd ? room.contractEnd.slice(0, 10) : "",
        imageUrl: room.imageUrl || "",
      });
    }
  }, [room]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await api.put(`/owner/rooms/${room.id}`, {
        name: form.name.trim(),
        price: Number(form.price),
        electricMeterNow: Number(form.electricMeterNow) || 0,
        electricMeterAfter: Number(form.electricMeterAfter) || 0,
        waterMeterNow: Number(form.waterMeterNow) || 0,
        waterMeterAfter: Number(form.waterMeterAfter) || 0,
        contractStart: form.contractStart || null,
        contractEnd: form.contractEnd || null,
        imageUrl: form.imageUrl || null,
      });

      toast.success("Room updated successfully");
      onUpdated();
      onClose();
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error("Update failed");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center ">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Edit Room</h2>
        </div>

        {/* BODY (SCROLL) */}
        <div className="px-6 py-4 overflow-y-auto space-y-3">
          {/* Room name */}
          <label className="block font-medium">Room Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* Price */}
          <label className="block font-medium">Price</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* Electric */}
          <label className="block font-medium">Electric Meter (Current)</label>
          <input
            type="number"
            name="electricMeterNow"
            value={form.electricMeterNow}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <label className="block font-medium">Electric Meter (After)</label>
          <input
            type="number"
            name="electricMeterAfter"
            value={form.electricMeterAfter}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* Water */}
          <label className="block font-medium">Water Meter (Current)</label>
          <input
            type="number"
            name="waterMeterNow"
            value={form.waterMeterNow}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <label className="block font-medium">Water Meter (After)</label>
          <input
            type="number"
            name="waterMeterAfter"
            value={form.waterMeterAfter}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* Contract */}
          <label className="block font-medium">Contract Start</label>
          <input
            type="date"
            name="contractStart"
            value={form.contractStart}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <label className="block font-medium">Contract End</label>
          <input
            type="date"
            name="contractEnd"
            value={form.contractEnd}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* Image */}
          <label className="block font-medium">Image URL</label>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
