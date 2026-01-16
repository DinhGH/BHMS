import { useState } from "react";
import { X } from "lucide-react";
import api from "../server/api.js";

export default function BoardingHouseFormModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    electricFee: "",
    waterFee: "",
    services: "",
    image: "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const parseServices = (text) => {
    if (!text) return null;

    const services = {};

    text
      .split(/,|\n/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .forEach((service) => {
        services[service] = true;
      });

    return Object.keys(services).length ? services : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      address: form.address,
      electricFee: Number(form.electricFee),
      waterFee: Number(form.waterFee),
      services: parseServices(form.services),
      image: form.image?.trim() || null,
    };

    try {
      const existed = await api.get(
        `/owner/boarding-houses/check?name=${encodeURIComponent(payload.name)}`
      );

      if (existed?.id) {
        await api.put(`/owner/boarding-houses/${existed.id}`, payload);
      } else {
        await api.post("/owner/boarding-houses", payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Save boarding house error", err);
      console.log(err.response?.data);
      alert("Có lỗi xảy ra");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-[480px] rounded-xl p-6 space-y-4"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Thêm / Cập nhật nhà trọ</h2>
          <X className="cursor-pointer" onClick={onClose} />
        </div>

        <div className="space-y-8">
          <label className="text-sm font-medium text-gray-600 rounded-md ">
            Tên nhà trọ:
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input"
            placeholder="Nhập tên nhà trọ"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Địa chỉ</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="input"
            placeholder="Nhập địa chỉ"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Giá điện (VNĐ/kWh)
          </label>
          <input
            type="number"
            name="electricFee"
            value={form.electricFee}
            onChange={handleChange}
            className="input"
            placeholder="Ví dụ: 3500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Giá nước (VNĐ/m³)
          </label>
          <input
            type="number"
            name="waterFee"
            value={form.waterFee}
            onChange={handleChange}
            className="input"
            placeholder="Ví dụ: 15000"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Hình ảnh (URL)
          </label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            className="input"
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">Dịch vụ</label>
          <textarea
            name="services"
            value={form.services}
            onChange={handleChange}
            className="input min-h-[80px]"
            placeholder="wifi, parking, camera..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
