import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../server/api";

export default function EditServiceQuantityModal({
  isOpen,
  onClose,
  roomId,
  service,
  onSuccess,
}) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setQuantity(service.quantity || 1);
    }
  }, [service, isOpen]);

  const handleSave = async () => {
    if (!quantity || quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      setLoading(true);
      await api.put(
        `/api/owner/rooms/${roomId}/services/${service.serviceId}`,
        {
          quantity: Number(quantity),
        },
      );
      toast.success("Service updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating service:", err);
      toast.error(err?.response?.data?.message || "Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !service) return null;

  const totalPrice = (Number(service.price) * Number(quantity)).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
        <h3 className="text-lg font-semibold mb-4">
          Edit {service.service?.name}
        </h3>

        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity ({service.service?.unit || "units"})
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Price Display (Read-only) */}
        <div className="mb-6 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{quantity}</span> × $
            <span className="font-medium">
              {Number(service.price).toFixed(2)}
            </span>
            {" = $"}
            <span className="font-bold text-blue-600">{totalPrice}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
