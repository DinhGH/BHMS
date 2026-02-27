import { useState } from "react";
import { updateRoomServiceQuantity } from "../services/roomServiceApi";
import { toast } from "react-hot-toast";

export default function EditQuantityModal({
  service,
  roomId,
  onClose,
  onUpdated,
}) {
  const [quantity, setQuantity] = useState(service.quantity || 1);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (quantity < 1) return toast.error("Quantity must be at least 1");

    try {
      setLoading(true);
      await updateRoomServiceQuantity(roomId, service.id, quantity);

      toast.success("Quantity updated successfully");
      onUpdated(); // reload list
      onClose(); // đóng modal
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 space-y-4">
        <h2 className="text-lg font-semibold">Edit Quantity</h2>

        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border rounded p-2"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
