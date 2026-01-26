import { useEffect, useState } from "react";
import api from "../server/api";
import { toast } from "react-hot-toast";

export default function RemoveTenantModal({
  open,
  roomId,
  onClose,
  onRemoved,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get(`/owner/rooms/${roomId}/tenants/search`, {
          params: { query: searchQuery },
        });
        setSuggestions(res);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, roomId]);

  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
    setSearchQuery(tenant.fullName);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!selectedTenant) {
      toast.error("Please select a tenant");
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/owner/rooms/${roomId}/tenants/${selectedTenant.id}`);
      toast.success(`${selectedTenant.fullName} removed from room`);
      onRemoved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold ">Remove Tenant From Room</h2>

        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedTenant(null);
          }}
          placeholder="Type tenant name..."
          className="w-full border p-2 rounded"
        />

        {searching && <div className="text-sm text-gray-400">Searching...</div>}

        {suggestions.length > 0 && (
          <div className="border rounded max-h-48 overflow-y-auto">
            {suggestions.map((t) => (
              <div
                key={t.id}
                onClick={() => handleSelectTenant(t)}
                className="p-3 hover:bg-red-50 cursor-pointer"
              >
                <div className="font-medium">{t.fullName}</div>
                <div className="text-sm text-gray-500">{t.email}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {t.age} years • {t.gender} • {t.phone || "No phone"}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTenant && (
          <div className="bg-red-50 p-3 rounded text-sm">
            Selected: <strong>{selectedTenant.fullName}</strong>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTenant || loading}
            className="bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 active:bg-amber-700 border border-amber-500 px-4 py-2 rounded"
          >
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
