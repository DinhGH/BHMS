import { FaBed } from "react-icons/fa";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../server/api.js";

export default function AddNewRoomModal({ open, onClose, houseId, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
  });

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

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

    if (form.image) {
      const urlRegex = /^(https?:\/\/)/i;
      if (!urlRegex.test(form.image.trim())) {
        newErrors.image = "Invalid image URL";
      }
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    validateForm();
  }, [form]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // const checkRoomNameExists = async () => {
  //   if (!houseId || !form.name.trim()) return false;

  //   try {
  //     const res = await api.get("/owner/rooms/check-name", {
  //       params: {
  //         houseId,
  //         name: form.name.trim(),
  //       },
  //     });
  //     return res.data.exists;
  //   } catch (err) {
  //     if (err.response?.status === 400) return false;
  //     throw err;
  //   }
  // };

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setLoading(true);

      // const existed = await checkRoomNameExists();
      // if (existed) {
      //   setErrors({ name: "Room name already exists in this house" });
      //   toast.error("Room name already exists");
      //   return;
      // }

      const payload = {
        houseId,
        name: form.name.trim(),
        price: Number(form.price),
        image: form.image?.trim() || null,
      };

      await api.post("/owner/rooms", payload);

      toast.success("Room added successfully");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add room");
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

        <h2 className="text-2xl font-semibold mb-6 text-center">
          Add New Room
        </h2>

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

        {/* Image */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">Image URL</label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="https://..."
          />
          {errors.image && (
            <p className="text-sm text-red-500 mt-1">{errors.image}</p>
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
