import { useEffect, useState } from "react";
import Loading from "./loading.jsx";
import { addServiceToRoomApi } from "../server/roomServiceApi.js";
import api from "../server/api";
import { toast } from "react-hot-toast";

export default function AddServiceModal({ roomId, onClose, onAdded }) {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const data = await api.get("/api/owner/services");
      const activeServices = Array.isArray(data)
        ? data.filter((s) => s.isActive)
        : [];
      setServices(activeServices);
    } catch (err) {
      console.error("Fetch services error:", err);
      toast.error("Failed to load services");
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSelectService = (id) => {
    setServiceId(id);
    const selected = services.find((s) => s.id === Number(id));

    if (selected) {
      setSelectedService(selected);
      setPrice(selected.price);

      // Reset quantity based on price type
      if (selected.priceType === "FIXED") {
        setQuantity(1);
      } else if (selected.priceType === "UNIT_BASED") {
        setQuantity(1); // Default to 1 for unit-based
      }
    } else {
      setSelectedService(null);
    }
  };

  const calculateTotal = () => {
    if (!price || !quantity) return 0;
    return Number(price) * Number(quantity);
  };

  const handleSubmit = async () => {
    if (!serviceId) {
      return toast.error("Please select a service");
    }

    if (price === "" || Number(price) < 0) {
      return toast.error("Please enter a valid price");
    }

    if (
      selectedService?.priceType === "UNIT_BASED" &&
      (!quantity || quantity < 1)
    ) {
      return toast.error("Please enter a valid quantity");
    }

    try {
      setLoading(true);
      await addServiceToRoomApi(roomId, {
        serviceId: Number(serviceId),
        price: Number(price),
        quantity: Number(quantity),
      });
      toast.success("Service added to room successfully");
      onAdded();
      onClose();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || err.message || "Add service failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const isUnitBased = selectedService?.priceType === "UNIT_BASED";

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-[450px] p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add Service to Room</h2>

        <Loading isLoading={loadingServices} />
        {!loadingServices && services.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No active services available
          </div>
        ) : (
          <>
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={serviceId}
                onChange={(e) => handleSelectService(e.target.value)}
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - ${s.price.toLocaleString()}
                    {s.priceType === "UNIT_BASED" && s.unit
                      ? ` / ${s.unit}`
                      : " / room"}
                  </option>
                ))}
              </select>

              {selectedService && (
                <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {selectedService.priceType === "FIXED"
                        ? "📌 Fixed Price"
                        : "📊 Unit Based"}
                    </span>
                    {selectedService.description && (
                      <span className="text-gray-500">
                        - {selectedService.description}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Price per{" "}
                {isUnitBased ? selectedService?.unit || "unit" : "room"} ($)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {serviceId && (
                <p className="text-xs text-gray-500 mt-1">
                  Default:{" "}
                  {services
                    .find((s) => s.id === Number(serviceId))
                    ?.price.toLocaleString()}
                  $
                </p>
              )}
            </div>

            {/* Quantity - Only for UNIT_BASED */}
            {isUnitBased && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity ({selectedService?.unit || "units"})
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  For services like parking, drinks, etc.
                </p>
              </div>
            )}

            {/* Total Price Display */}
            {selectedService && price && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total Cost:
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    {calculateTotal().toLocaleString()}$
                  </span>
                </div>
                {isUnitBased && quantity > 1 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {price.toLocaleString()}$ × {quantity}{" "}
                    {selectedService.unit || "units"}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || loadingServices || !serviceId}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add Service"}
          </button>
        </div>
      </div>
    </div>
  );
}
