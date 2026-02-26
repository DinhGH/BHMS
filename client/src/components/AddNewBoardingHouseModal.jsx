import { FaHome } from "react-icons/fa";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  checkBoardingHouseByName,
  createBoardingHouse,
  updateBoardingHouse,
} from "../services/boardingHouse";

export default function AddNewBoardingHouseModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    electricFee: "",
    waterFee: "",
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Boarding house name is required";
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (form.electricFee && Number(form.electricFee) <= 0) {
      newErrors.electricFee = "Electricity price must be greater than 0";
    }

    if (form.waterFee && Number(form.waterFee) <= 0) {
      newErrors.waterFee = "Water price must be greater than 0";
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  useEffect(() => {
    validateForm();
  }, [form]);

  if (!open) return null;

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("address", form.address.trim());
      formData.append(
        "electricFee",
        form.electricFee ? Number(form.electricFee) : 0,
      );
      formData.append("waterFee", form.waterFee ? Number(form.waterFee) : 0);

      if (form.image) {
        formData.append("image", form.image);
      }

      const existed = await checkBoardingHouseByName(form.name.trim());

      if (existed?.id) {
        await updateBoardingHouse(existed.id, formData);
        toast.success("Boarding house updated successfully");
      } else {
        await createBoardingHouse(formData);
        toast.success("Boarding house added successfully");
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl max-h-screen p-6 overflow-y-auto rounded-lg">
        <div
          className="flex items-center mb-6 cursor-pointer"
          onClick={onClose}
        >
          <FaHome className="text-xl mr-2" />
          <span className="font-semibold text-lg">Back</span>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          Add Boarding House
        </h2>

        {/* Name */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Boarding House Name *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Address *</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.address && (
            <p className="text-red-500 text-sm">{errors.address}</p>
          )}
        </div>

        {/* Electric */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Electricity Price</label>
          <input
            type="number"
            name="electricFee"
            value={form.electricFee}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.electricFee && (
            <p className="text-red-500 text-sm">{errors.electricFee}</p>
          )}
        </div>

        {/* Water */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Water Price</label>
          <input
            type="number"
            name="waterFee"
            value={form.waterFee}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.waterFee && (
            <p className="text-red-500 text-sm">{errors.waterFee}</p>
          )}
        </div>

        {/* Image */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">Boarding House Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
            className="w-full border p-2 rounded bg-white"
          />
          {errors.image && (
            <p className="text-red-500 text-sm">{errors.image}</p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            disabled={!isValid || loading}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded text-white ${
              isValid && !loading
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 cursor-not-allowed"
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
