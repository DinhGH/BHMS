import { useEffect, useState } from "react";
import { updateBoardingHouse } from "../services/boardingHouse";
import toast from "react-hot-toast";

export default function EditBoardingHouseModal({
  open,
  onClose,
  house,
  onSuccess,
}) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    electricFee: "",
    waterFee: "",
    image: null,
    preview: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (house) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: house.name,
        address: house.address,
        electricFee: house.electricFee,
        waterFee: house.waterFee,
        image: null,
        preview: house.imageUrl || "",
      });
    }
  }, [house]);

  useEffect(() => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Boarding house name is required";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Address is required";
    }

    const electric = Number(form.electricFee);
    const water = Number(form.waterFee);

    if (!Number.isFinite(electric) || electric <= 0) {
      nextErrors.electricFee = "Electricity fee must be greater than 0";
    }

    if (!Number.isFinite(water) || water <= 0) {
      nextErrors.waterFee = "Water fee must be greater than 0";
    }

    setErrors(nextErrors);
    setIsValid(Object.keys(nextErrors).length === 0);
  }, [form.name, form.address, form.electricFee, form.waterFee]);

  if (!open || !house) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      setForm({
        ...form,
        image: file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Please fix the form errors before saving");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("address", form.address.trim());
      formData.append("electricFee", Number(form.electricFee));
      formData.append("waterFee", Number(form.waterFee));

      // 👇 chỉ gửi file nếu người dùng chọn ảnh mới
      if (form.image) {
        formData.append("image", form.image);
      }
      setLoading(true);
      await updateBoardingHouse(house.id, formData);

      toast.success("Updated boarding house successfully");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Update boarding house failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold">Edit Boarding House</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Boarding House Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter boarding house name"
              className="w-full border px-3 py-2 rounded"
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Address *</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter address"
              className="w-full border px-3 py-2 rounded"
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Electricity Fee (VND) *</label>
            <input
              type="number"
              min="1"
              name="electricFee"
              value={form.electricFee}
              onChange={handleChange}
              placeholder="Enter electricity fee"
              className="w-full border px-3 py-2 rounded"
            />
            {errors.electricFee && (
              <p className="text-sm text-red-500 mt-1">{errors.electricFee}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Water Fee (VND) *</label>
            <input
              type="number"
              min="1"
              name="waterFee"
              value={form.waterFee}
              onChange={handleChange}
              placeholder="Enter water fee"
              className="w-full border px-3 py-2 rounded"
            />
            {errors.waterFee && (
              <p className="text-sm text-red-500 mt-1">{errors.waterFee}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Boarding House Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border px-3 py-2 rounded bg-white"
            />

            {form.preview && (
              <img
                src={form.preview}
                alt="Boarding house preview"
                className="mt-3 w-full h-48 object-cover rounded border"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className={`px-4 py-2 rounded text-white ${
              !loading && isValid
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
