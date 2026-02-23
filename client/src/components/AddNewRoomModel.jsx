import { FaBed } from "react-icons/fa";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../server/api.js";

export default function AddNewRoomModal({ open, onClose, houseId, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    contractStart: "",
    contractEnd: "",
  });

  const [attachRoomId, setAttachRoomId] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Room name is required";
    }

    if (!form.price) {
      newErrors.price = "Rent price is required";
    } else if (Number(form.price) <= 0) {
      newErrors.price = "Rent price must be greater than 0";
    }

    if (form.contractStart && form.contractEnd) {
      if (new Date(form.contractEnd) <= new Date(form.contractStart)) {
        newErrors.contractEnd = "Contract end date must be after start date";
      }
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [form]);

  useEffect(() => {
    if (!open || !houseId) return;

    const fetchAvailableRooms = async () => {
      try {
        setLoadingRooms(true);
        const data = await api.get("/api/owner/rooms", {
          params: { unassigned: "true" },
        });
        setAvailableRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load available rooms");
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchAvailableRooms();
  }, [open, houseId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);

      const payload = {
        houseId,
        name: form.name.trim(),
        price: Number(form.price),
        image: form.image ? form.image.trim() : null,
        contractStart: form.contractStart ? new Date(form.contractStart) : null,
        contractEnd: form.contractEnd ? new Date(form.contractEnd) : null,
      };

      await api.post("/api/owner/rooms", payload);

      toast.success("Room added successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add room");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadRoomImage = async (file) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      const body = new FormData();
      body.append("image", file);
      const result = await api.post(
        "/api/owner/uploads/image?target=room",
        body,
      );

      if (!result?.url) {
        throw new Error("Upload completed but URL was not returned");
      }

      setForm((prev) => ({ ...prev, image: result.url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAttachRoom = async () => {
    if (!houseId) return;
    const parsedRoomId = Number(attachRoomId);
    if (!parsedRoomId || Number.isNaN(parsedRoomId)) {
      toast.error("Invalid room ID");
      return;
    }

    try {
      setLoading(true);
      await api.put(`/api/owner/rooms/${parsedRoomId}`, {
        houseId,
      });
      toast.success("Room added to boarding house");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to attach room to house",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  /* ================= UI ================= */
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

        {/* Contract Start */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Contract start date</label>
          <input
            type="date"
            name="contractStart"
            value={form.contractStart}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Contract End */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Contract end date</label>
          <input
            type="date"
            name="contractEnd"
            value={form.contractEnd}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.contractEnd && (
            <p className="text-sm text-red-500 mt-1">{errors.contractEnd}</p>
          )}
        </div>

        {/* Image */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleUploadRoomImage(e.target.files?.[0])}
            className="w-full border p-2 rounded"
          />
          {uploadingImage && (
            <p className="text-blue-500 text-sm mt-1">Uploading image...</p>
          )}
          {form.image && (
            <img
              src={form.image}
              alt="Room preview"
              className="mt-2 h-28 w-full object-cover rounded border"
            />
          )}
          {errors.image && (
            <p className="text-sm text-red-500 mt-1">{errors.image}</p>
          )}
        </div>

        {/* Actions */}
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

        {houseId && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-3">Attach existing room</h3>
            <div className="space-y-3">
              <div>
                <label className="block mb-1 font-medium">Room ID</label>
                <input
                  type="number"
                  value={attachRoomId}
                  onChange={(e) => setAttachRoomId(e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder="Enter room ID"
                />
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Available rooms</div>
                {loadingRooms ? (
                  <div className="text-sm text-slate-500">Loading...</div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No unassigned rooms
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                    {availableRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setAttachRoomId(String(room.id))}
                        className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-slate-100 ${
                          String(room.id) === String(attachRoomId)
                            ? "bg-slate-100"
                            : ""
                        }`}
                      >
                        #{room.id} - {room.name} (${room.price})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={loading || !attachRoomId}
                  onClick={handleAttachRoom}
                  className={`px-4 py-2 rounded text-white ${
                    !attachRoomId || loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loading ? "Attaching..." : "Attach Room"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
