import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../server/api";

export default function EditInvoiceModal({
  invoice,
  roomId,
  room,
  onClose,
  onUpdated,
}) {
  const previousElectric = Number(
    room?.electricMeterNow ?? room?.electricMeterAfter ?? 0,
  );
  const previousWater = Number(
    room?.waterMeterNow ?? room?.waterMeterAfter ?? 0,
  );
  const electricFee = Number(room?.electricFee ?? 0);
  const waterFee = Number(room?.waterFee ?? 0);

  const inferredElectricAfter =
    room?.electricMeterAfter ??
    (electricFee > 0
      ? previousElectric + Number(invoice?.electricCost ?? 0) / electricFee
      : previousElectric);
  const inferredWaterAfter =
    room?.waterMeterAfter ??
    (waterFee > 0
      ? previousWater + Number(invoice?.waterCost ?? 0) / waterFee
      : previousWater);

  const [form, setForm] = useState({
    month: invoice?.month ?? "",
    year: invoice?.year ?? "",
    roomPrice: invoice?.roomPrice ?? 0,
    electricMeterAfter: Number(inferredElectricAfter || 0),
    waterMeterAfter: Number(inferredWaterAfter || 0),
    serviceCost: invoice?.serviceCost ?? 0,
    status: "PENDING",
  });
  const [loading, setLoading] = useState(false);

  const electricCost = useMemo(() => {
    const after = Number(form.electricMeterAfter || 0);
    const usage = Math.max(0, after - previousElectric);
    return usage * electricFee;
  }, [form.electricMeterAfter, previousElectric, electricFee]);

  const waterCost = useMemo(() => {
    const after = Number(form.waterMeterAfter || 0);
    const usage = Math.max(0, after - previousWater);
    return usage * waterFee;
  }, [form.waterMeterAfter, previousWater, waterFee]);

  const totalAmount = useMemo(() => {
    return (
      Number(form.roomPrice || 0) +
      Number(electricCost || 0) +
      Number(waterCost || 0) +
      Number(form.serviceCost || 0)
    );
  }, [form.roomPrice, form.serviceCost, electricCost, waterCost]);

  const formatUsd = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.month || form.month < 1 || form.month > 12) {
      return toast.error("Invalid month (must be 1–12).");
    }
    if (!form.year || form.year < 2000) {
      return toast.error("Invalid year (must be 2000 or later).");
    }
    if (Number(form.electricMeterAfter) < previousElectric) {
      return toast.error(
        "New electric meter reading must be ≥ previous reading.",
      );
    }
    if (Number(form.waterMeterAfter) < previousWater) {
      return toast.error("New water meter reading must be ≥ previous reading.");
    }
    if (totalAmount <= 0) {
      return toast.error("Total amount must be greater than 0.");
    }

    try {
      setLoading(true);
      const result = await api.put(
        `/api/owner/rooms/${roomId}/invoices/${invoice.id}`,
        {
          month: Number(form.month),
          year: Number(form.year),
          roomPrice: Number(form.roomPrice),
          electricMeterAfter: Number(form.electricMeterAfter),
          waterMeterAfter: Number(form.waterMeterAfter),
          serviceCost: Number(form.serviceCost),
          status: "PENDING",
        },
      );
      toast.success(
        result?.emailResent
          ? "Invoice updated and email resent to tenant."
          : "Invoice updated successfully.",
      );
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update invoice.");
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <h2 className="text-lg font-semibold">Edit Invoice</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Month</label>
            <input
              type="number"
              min="1"
              max="12"
              name="month"
              value={form.month}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Year</label>
            <input
              type="number"
              min="2000"
              name="year"
              value={form.year}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Room Price</label>
            <input
              type="number"
              name="roomPrice"
              value={form.roomPrice}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Electric Meter (new reading)
            </label>
            <input
              type="number"
              min={previousElectric}
              name="electricMeterAfter"
              value={form.electricMeterAfter}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Previous: {previousElectric} · Rate: {formatUsd(electricFee)} ·
              Cost: {formatUsd(electricCost)}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Water Meter (new reading)
            </label>
            <input
              type="number"
              min={previousWater}
              name="waterMeterAfter"
              value={form.waterMeterAfter}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Previous: {previousWater} · Rate: {formatUsd(waterFee)} · Cost:{" "}
              {formatUsd(waterCost)}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Service Cost
            </label>
            <input
              type="number"
              name="serviceCost"
              value={form.serviceCost}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            name="status"
            value="PENDING"
            disabled
            className="w-full cursor-not-allowed rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-800 disabled:opacity-100 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200"
          >
            <option value="PENDING">PENDING</option>
          </select>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            When an invoice is edited, status is automatically reset to pending.
          </p>
        </div>

        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-slate-700 dark:border-blue-700/50 dark:bg-blue-900/25 dark:text-slate-100">
          Total: <strong>{formatUsd(totalAmount)}</strong>
        </div>

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
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
