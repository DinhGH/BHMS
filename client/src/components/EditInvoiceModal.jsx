import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../server/api";

const STATUS_OPTIONS = ["PENDING", "PAID", "OVERDUE"];

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
    status: invoice?.status ?? "PENDING",
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
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.month || form.month < 1 || form.month > 12) {
      return toast.error("Tháng không hợp lệ");
    }

    if (!form.year || form.year < 2000) {
      return toast.error("Năm không hợp lệ");
    }

    if (Number(form.electricMeterAfter) < previousElectric) {
      return toast.error(
        "Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số trước đó",
      );
    }

    if (Number(form.waterMeterAfter) < previousWater) {
      return toast.error(
        "Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số trước đó",
      );
    }

    if (totalAmount <= 0) {
      return toast.error("Tổng tiền phải lớn hơn 0");
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
          status: form.status,
        },
      );
      toast.success(
        result?.emailResent
          ? "Đã cập nhật hóa đơn và gửi lại email cho tenant"
          : "Đã cập nhật hóa đơn",
      );
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật hóa đơn thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-120 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Chỉnh sửa hóa đơn</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tháng</label>
            <input
              type="number"
              min="1"
              max="12"
              name="month"
              value={form.month}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Năm</label>
            <input
              type="number"
              min="2000"
              name="year"
              value={form.year}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tiền phòng</label>
            <input
              type="number"
              name="roomPrice"
              value={form.roomPrice}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tiền điện</label>
            <input
              type="number"
              min={previousElectric}
              name="electricMeterAfter"
              value={form.electricMeterAfter}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Chỉ số cũ: {previousElectric} • Đơn giá: {formatUsd(electricFee)}{" "}
              • Thành tiền: {formatUsd(electricCost)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tiền nước</label>
            <input
              type="number"
              min={previousWater}
              name="waterMeterAfter"
              value={form.waterMeterAfter}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              Chỉ số cũ: {previousWater} • Đơn giá: {formatUsd(waterFee)} •
              Thành tiền: {formatUsd(waterCost)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dịch vụ</label>
            <input
              type="number"
              name="serviceCost"
              value={form.serviceCost}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-gray-700">
          Tổng tiền: <strong>{formatUsd(totalAmount)}</strong>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
