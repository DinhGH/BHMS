import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../server/api";

export default function MakeInvoiceModal({ room, onClose, onCreated }) {
  const [electricCurrent, setElectricCurrent] = useState("");
  const [waterCurrent, setWaterCurrent] = useState("");
  const [loading, setLoading] = useState(false);

  const previousElectric = useMemo(() => {
    const after = Number(room?.electricMeterAfter ?? 0);
    const now = Number(room?.electricMeterNow ?? 0);
    return after || now || 0;
  }, [room]);

  const previousWater = useMemo(() => {
    const after = Number(room?.waterMeterAfter ?? 0);
    const now = Number(room?.waterMeterNow ?? 0);
    return after || now || 0;
  }, [room]);

  const electricFee = Number(room?.electricFee ?? 0);
  const waterFee = Number(room?.waterFee ?? 0);

  const electricUsage = Math.max(
    0,
    Number(electricCurrent || 0) - Number(previousElectric || 0),
  );
  const waterUsage = Math.max(
    0,
    Number(waterCurrent || 0) - Number(previousWater || 0),
  );

  const electricCost = electricUsage * electricFee;
  const waterCost = waterUsage * waterFee;

  const formatUsd = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const handleSubmit = async () => {
    const currentElectric = Number(electricCurrent);
    const currentWater = Number(waterCurrent);

    if (Number.isNaN(currentElectric) || currentElectric < previousElectric) {
      return toast.error("Invalid current electric meter reading");
    }

    if (Number.isNaN(currentWater) || currentWater < previousWater) {
      return toast.error("Invalid current water meter reading");
    }

    try {
      setLoading(true);
      await api.post(`/api/owner/rooms/${room.id}/invoice`, {
        electricMeterAfter: currentElectric,
        waterMeterAfter: currentWater,
      });
      toast.success("Invoice created and emailed to the primary tenant");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-120 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Create Invoice</h2>

        <div className="text-sm text-gray-600">
          The tenant will receive an email with 3 payment options: QR transfer,
          Stripe, and cash.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-gray-500">
              Previous electric meter: {previousElectric}
            </div>
            <label className="block text-sm font-medium">
              Current electric meter
            </label>
            <input
              type="number"
              min={previousElectric}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={electricCurrent}
              onChange={(e) => setElectricCurrent(e.target.value)}
              placeholder="Enter electric meter"
            />
            <div className="text-xs text-gray-500">
              Estimated electric cost: {formatUsd(electricCost)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-gray-500">
              Previous water meter: {previousWater}
            </div>
            <label className="block text-sm font-medium">
              Current water meter
            </label>
            <input
              type="number"
              min={previousWater}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={waterCurrent}
              onChange={(e) => setWaterCurrent(e.target.value)}
              placeholder="Enter water meter"
            />
            <div className="text-xs text-gray-500">
              Estimated water cost: {formatUsd(waterCost)}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-gray-700">
          The final total will include room rent and services.
        </div>

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
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Send invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
