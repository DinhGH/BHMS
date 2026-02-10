import { useState } from "react";
import { toast } from "react-hot-toast";

export default function DeleteHouseModal({ open, onClose, houses, onDelete }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const suggestions = houses.filter((h) =>
    h.name.toLowerCase().includes(value.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!value.trim()) {
      toast.error("Please enter a boarding house name");
      return;
    }

    const existed = houses.find(
      (h) => h.name.toLowerCase() === value.trim().toLowerCase(),
    );

    if (!existed) {
      toast.error("Boarding house not found");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${existed.name}"?\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await onDelete(existed.name);
      toast.success("Boarding house deleted successfully");
      setValue("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to delete boarding house",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-red-600">
          Delete Boarding House
        </h3>

        <p className="text-sm text-slate-500">
          Type the boarding house name to delete
        </p>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter house name..."
          className="w-full border rounded-md px-3 py-2"
        />

        {/* Suggestions */}
        {value && (
          <div className="border rounded-md max-h-40 overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">
                No matching houses
              </div>
            ) : (
              suggestions.map((h) => (
                <div
                  key={h.id}
                  className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
                  onClick={() => setValue(h.name)}
                >
                  {h.name}
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm border rounded-md"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className={`px-4 py-2 text-sm text-white rounded-md ${
              loading
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
