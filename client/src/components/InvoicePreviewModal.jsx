import { useEffect, useState } from "react";
import {
  previewInvoice,
  sendInvoice,
  createInvoiceWithQr,
} from "../services/invoiceApi";
import toast from "react-hot-toast";

export default function InvoicePreviewModal({ room, open, onClose }) {
  const [data, setData] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (open && room?.id) {
      previewInvoice(room.id)
        .then(setData)
        .catch(() => toast.error("Failed to load invoice preview"));
      setWarning(null);
    }
  }, [open, room]);

  const handleSend = async () => {
    try {
      setLoading(true);
      setWarning(null);
      let response;
      if (file) {
        response = await createInvoiceWithQr(room.id, file);
      } else {
        response = await sendInvoice(room.id);
      }
      toast.success("Invoice sent successfully!");

      // Show warning if present
      if (response?.data?.warning) {
        setWarning(response.data.warning);
        setTimeout(() => onClose(), 2000); // Auto close after 2s
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to send invoice");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 space-y-5 animate-fadeIn">
        {/* HEADER */}
        <h2 className="text-xl font-semibold text-center border-b pb-3">
          Invoice Preview
        </h2>

        {warning && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            ℹ️ {warning}
          </div>
        )}

        {/* ROOM INFO */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Room:</span>
            <span className="font-medium">{room.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Tenants:</span>
            <span className="font-medium">{data.numberOfTenants}</span>
          </div>
        </div>

        {/* COST BREAKDOWN */}
        <div className="border rounded-lg divide-y text-sm">
          <div className="flex justify-between p-3">
            <span>Room Price</span>
            <span>{data.roomPrice.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between p-3">
            <span>Electric Cost</span>
            <span>{data.electricCost.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between p-3">
            <span>Water Cost</span>
            <span>{data.waterCost.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between p-3">
            <span>Service Cost</span>
            <span>{data.serviceCost.toLocaleString()}đ</span>
          </div>

          <div className="flex justify-between p-3 font-semibold text-blue-600 bg-blue-50">
            <span>Total</span>
            <span>{data.total.toLocaleString()}đ</span>
          </div>
        </div>

        {/* QR UPLOAD */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Upload Owner QR (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border px-3 py-2 rounded bg-white"
          />

          {file && (
            <img
              src={URL.createObjectURL(file)}
              alt="QR preview"
              className="mt-2 w-32 h-32 object-contain border rounded mx-auto"
            />
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {loading ? "Sending..." : "Send Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
