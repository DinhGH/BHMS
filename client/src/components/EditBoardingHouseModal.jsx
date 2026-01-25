import { useEffect, useState } from "react";
import api from "../server/api";

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
    imageUrl: "",
  });

  useEffect(() => {
    if (house) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: house.name,
        address: house.address,
        electricFee: house.electricFee,
        waterFee: house.waterFee,
        imageUrl: house.imageUrl || "",
      });
    }
  }, [house]);

  if (!open || !house) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await api.put(`/owner/boarding-houses/${house.id}`, form);
      alert("Updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed");
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

        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="Image URL"
          className="w-full border px-3 py-2 rounded"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
