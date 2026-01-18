import { FaHome } from "react-icons/fa";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../server/api.js";

export default function AddNewBoardingHouseModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    electricFee: "",
    waterFee: "",
    services: "",
    image: "",
  });

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

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

    if (form.image) {
      const urlRegex = /^(https?:\/\/)/i;
      if (!urlRegex.test(form.image.trim())) {
        newErrors.image = "Invalid image URL";
      }
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

      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        electricFee: form.electricFee ? Number(form.electricFee) : null,
        waterFee: form.waterFee ? Number(form.waterFee) : null,
        services: parseServices(form.services),
        image: form.image?.trim() || null,
      };

      const existed = await api.get(
        `/owner/boarding-houses/check?name=${encodeURIComponent(payload.name)}`,
      );

      if (existed?.id) {
        await api.put(`/owner/boarding-houses/${existed.id}`, payload);
        toast.success("Boarding house updated successfully");
      } else {
        await api.post("/owner/boarding-houses", payload);
        toast.success("Boarding house added successfully");
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl max-h-screen p-6 overflow-y-auto relative rounded-lg">
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
        <div className="mb-4">
          <label className="block mb-1 font-medium">Image URL</label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.image && (
            <p className="text-red-500 text-sm">{errors.image}</p>
          )}
        </div>

        {/* Services */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">Services</label>
          <textarea
            name="services"
            value={form.services}
            onChange={handleChange}
            className="w-full border p-2 rounded min-h-[90px]"
            placeholder="wifi, parking, camera..."
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            disabled={!isValid || loading}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded text-white ${
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
