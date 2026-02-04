import { useEffect, useState } from "react";
import { updateContract } from "../services/boardingHouse";
import { toast } from "react-hot-toast";

export default function EditRoomModal({ open, room, onClose, onUpdated }) {
  const [form, setForm] = useState({
    electricMeterNow: "",
    electricMeterAfter: "",
    waterMeterNow: "",
    waterMeterAfter: "",
    contractStart: "",
    contractEnd: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        electricMeterNow: room.electricMeterAfter ?? 0,
        waterMeterNow: room.waterMeterAfter ?? 0,

        electricMeterAfter: "",
        waterMeterAfter: "",

        contractStart: room.contractStart?.slice(0, 10) || "",
        contractEnd: room.contractEnd?.slice(0, 10) || "",
      });
    }
  }, [room]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {};

      const electricNow = Number(form.electricMeterNow);
      const electricAfter = Number(form.electricMeterAfter);
      const waterNow = Number(form.waterMeterNow);
      const waterAfter = Number(form.waterMeterAfter);

      if (!isNaN(electricNow)) payload.electricMeterNow = electricNow;
      if (!isNaN(electricAfter)) payload.electricMeterAfter = electricAfter;
      if (!isNaN(waterNow)) payload.waterMeterNow = waterNow;
      if (!isNaN(waterAfter)) payload.waterMeterAfter = waterAfter;

      if (form.contractStart) payload.contractStart = form.contractStart;
      if (form.contractEnd) payload.contractEnd = form.contractEnd;

      await updateContract(payload, room.id);
      setLoading(false);
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
          <h2 className="text-xl font-semibold">Edit Contract</h2>
        </div>

        <div className="px-6 py-4 overflow-y-auto space-y-3">
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
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
