import { FaBed } from "react-icons/fa";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../server/api";

export default function EditRoomModal({ open, room, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    electricMeter: "",
    waterMeter: "",
    imageUrl: "",
  });

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setForm({
        name: room.name || "",
        price: room.price || "",
        electricMeter: room.electricMeter || "",
        waterMeter: room.waterMeter || "",
        imageUrl: room.imageUrl || "",
      });
    }
  }, [room]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Room name is required";
    }

    if (!form.price) {
      newErrors.price = "Rent price is required";
    } else if (Number(form.price) <= 0) {
      newErrors.price = "Rent price must be greater than 0";
    }

    if (form.imageUrl) {
      const urlRegex = /^(https?:\/\/)/i;
      if (!urlRegex.test(form.imageUrl.trim())) {
        newErrors.imageUrl = "Invalid image URL";
      }
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  useEffect(() => {
    validateForm();
  }, [form]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!isValid || !room) return;

    try {
      setLoading(true);

      await api.put(`/owner/rooms/${room.id}`, {
        name: form.name.trim(),
        price: Number(form.price),
        electricMeter: Number(form.electricMeter) || 0,
        waterMeter: Number(form.waterMeter) || 0,
        imageUrl: form.imageUrl.trim() || null,
      });

      toast.success("Room updated successfully");
      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update room");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg">
        {/* Header */}
        <div
          className="flex items-center mb-6 cursor-pointer"
          onClick={onClose}
        >
          <FaBed className="text-xl mr-2" />
          <span className="font-semibold text-lg">Back</span>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">Edit Room</h2>

        {/* Room name */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Room name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Room A1"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Rent price *</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="100"
          />
          {errors.price && (
            <p className="text-sm text-red-500 mt-1">{errors.price}</p>
          )}
        </div>

        {/* Electric meter */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Electric meter</label>
          <input
            type="number"
            name="electricMeter"
            value={form.electricMeter}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Water meter */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Water meter</label>
          <input
            type="number"
            name="waterMeter"
            value={form.waterMeter}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Image */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">Image URL</label>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="https://..."
          />
          {errors.imageUrl && (
            <p className="text-sm text-red-500 mt-1">{errors.imageUrl}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            disabled={!isValid || loading}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded text-white
              ${
                isValid && !loading
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            {loading ? "Saving..." : "Save"}
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
