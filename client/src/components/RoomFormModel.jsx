import { FaBed } from "react-icons/fa";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { createRoom, updateRoomDetails } from "../services/boardingHouse";

export default function RoomFormModal({
  open,
  onClose,
  houseId,
  onSuccess,
  roomData, // 👈 nếu có thì là EDIT
}) {
  const isEdit = !!roomData;

  const [form, setForm] = useState({
    name: "",
    price: "",
    image: null,
    preview: "",
  });

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= FILL DATA WHEN EDIT ================= */
  useEffect(() => {
    if (roomData) {
      setForm({
        name: roomData.name || "",
        price: roomData.price || "",
        image: null,
        preview: roomData.imageUrl || "",
      });
    } else {
      setForm({ name: "", price: "", image: null, preview: "" });
    }
  }, [roomData, open]);

  /* ================= VALIDATION ================= */
  useEffect(() => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Room name is required";

    if (!form.price) newErrors.price = "Rent price is required";
    else if (Number(form.price) <= 0)
      newErrors.price = "Rent price must be greater than 0";

    if (form.constractStart && form.constractEnd) {
      if (new Date(form.constractEnd) <= new Date(form.constractStart)) {
        newErrors.constractEnd = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [form]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("houseId", houseId);
      formData.append("name", form.name.trim());
      formData.append("price", Number(form.price));

      if (form.image) {
        formData.append("image", form.image);
      }

      if (isEdit) {
        // Use the new endpoint
        await updateRoomDetails(roomData.id, formData);
        toast.success("Room updated successfully");
      } else {
        await createRoom(formData);
        toast.success("Room added successfully");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(isEdit ? "Update failed" : "Create failed");
    } finally {
      setLoading(false);
    }
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg">
        <div
          className="flex items-center mb-6 cursor-pointer"
          onClick={onClose}
        >
          <FaBed className="text-xl mr-2" />
          <span className="font-semibold text-lg">Back</span>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          {isEdit ? "Edit Room" : "Add New Room"}
        </h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Room name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Rent price *</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.price && (
            <p className="text-sm text-red-500">{errors.price}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-medium">Room Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border p-2 rounded bg-white"
          />

          {form.preview && (
            <img
              src={form.preview}
              alt="preview"
              className="mt-3 w-full h-40 object-cover rounded"
            />
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            disabled={!isValid || loading}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded text-white ${isValid ? "bg-blue-600" : "bg-blue-500"}`}
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>

          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
