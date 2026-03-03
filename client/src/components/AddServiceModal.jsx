import { useEffect, useState } from "react";
import Loading from "./loading.jsx";
import { addServiceToRoomApi } from "../server/roomServiceApi.js";
// import api from "../server/api";
// import { addServiceToRoomApi } from "../services/roomServiceApi.js";
import { getServices } from "../services/roomServiceApi.js";
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
      const data = await getServices();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-112.5 space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Add Service to Room
        </h2>

        <Loading isLoading={loadingServices} />
        {!loadingServices && services.length === 0 ? (
          <div className="py-4 text-center text-slate-500 dark:text-slate-400">
            No active services available
          </div>
        ) : (
          <>
            {/* Service Selection */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
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
                <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-slate-700 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {selectedService.priceType === "FIXED"
                        ? "📌 Fixed Price"
                        : "📊 Unit Based"}
                    </span>
                    {selectedService.description && (
                      <span className="text-slate-500 dark:text-slate-300">
                        - {selectedService.description}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Price per{" "}
                {isUnitBased ? selectedService?.unit || "unit" : "room"} ($)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {serviceId && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Quantity ({selectedService?.unit || "units"})
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  For services like parking, drinks, etc.
                </p>
              </div>
            )}

            {/* Total Price Display */}
            {selectedService && price && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-700/50 dark:bg-emerald-900/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Total Cost:
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {calculateTotal().toLocaleString()}$
                  </span>
                </div>
                {isUnitBased && quantity > 1 && (
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {price.toLocaleString()}$ × {quantity}{" "}
                    {selectedService.unit || "units"}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-2 dark:border-slate-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
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
