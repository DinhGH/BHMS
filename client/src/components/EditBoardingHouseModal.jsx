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

  if (!open || !house) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({
        ...form,
        image: file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("address", form.address);
      formData.append("electricFee", form.electricFee);
      formData.append("waterFee", form.waterFee);

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Edit Boarding House</h2>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full border px-3 py-2 rounded"
        />

        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address"
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="number"
          name="electricFee"
          value={form.electricFee}
          onChange={handleChange}
          placeholder="Electric fee"
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="number"
          name="waterFee"
          value={form.waterFee}
          onChange={handleChange}
          placeholder="Water fee"
          className="w-full border px-3 py-2 rounded"
        />

        <div>
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
              alt="preview"
              className="mt-3 w-full h-40 object-cover rounded"
            />
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
