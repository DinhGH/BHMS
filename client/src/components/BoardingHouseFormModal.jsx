import { FaHome } from "react-icons/fa";
import { useState } from "react";
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
      .forEach((s) => (services[s] = true));
    return Object.keys(services).length ? services : null;
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address,
        electricFee: Number(form.electricFee),
        waterFee: Number(form.waterFee),
        services: parseServices(form.services),
        image: form.image?.trim() || null,
      };

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
      console.error(err);
      alert("Có lỗi xảy ra");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl max-h-screen p-6 overflow-y-auto relative">
        <div
          className="flex items-center mb-6 cursor-pointer"
          onClick={onClose}
        >
          <FaHome className="text-xl mr-2" />
          <span className="font-semibold text-lg">Back</span>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          Add / Update Boarding House
        </h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Tên nhà trọ *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Nhập tên nhà trọ"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Địa chỉ *</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Nhập địa chỉ"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Giá điện (VNĐ/kWh)</label>
          <input
            type="number"
            name="electricFee"
            value={form.electricFee}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Ví dụ: 3500"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Giá nước (VNĐ/m³)</label>
          <input
            type="number"
            name="waterFee"
            value={form.waterFee}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Ví dụ: 15000"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Hình ảnh</label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="URL hình ảnh"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-medium">Dịch vụ</label>
          <textarea
            name="services"
            value={form.services}
            onChange={handleChange}
            className="w-full border p-2 rounded min-h-[90px]"
            placeholder="wifi, parking, camera..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
