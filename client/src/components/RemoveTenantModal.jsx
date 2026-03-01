import { useEffect, useState } from "react";
import { removeTenantFromRoom } from "../services/boardingHouse";
import { toast } from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext";

export default function RemoveTenantModal({
  open,
  roomId,
  roomTenants = [],
  onClose,
  onRemoved,
}) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const baseList = Array.isArray(roomTenants) ? roomTenants : [];

    if (!normalizedQuery) {
      setSuggestions(baseList);
      return;
    }

    const filtered = baseList.filter((tenant) => {
      const fullName = String(tenant?.fullName || "").toLowerCase();
      const email = String(tenant?.email || "").toLowerCase();
      const phone = String(tenant?.phone || "").toLowerCase();
      return (
        fullName.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        phone.includes(normalizedQuery)
      );
    });

    setSuggestions(filtered);
  }, [open, searchQuery, roomTenants]);

  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setSelectedTenant(null);
  }, [open]);

  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
    setSearchQuery(tenant.fullName);
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedTenant(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedTenant) {
      toast.error("Please select a tenant");
      return;
    }

    try {
      setLoading(true);
      await removeTenantFromRoom(roomId, selectedTenant.id);
      toast.success(`${selectedTenant.fullName} removed from room`);
      onRemoved();
      handleClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className={`p-6 rounded-lg w-full max-w-xl space-y-4 border shadow-xl ${
          isDark
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <h2 className="text-lg font-semibold ">Remove Tenant From Room</h2>

        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedTenant(null);
          }}
          placeholder="Search by name, email or phone..."
          className={`w-full border p-2 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
            isDark
              ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
              : "bg-white border-slate-300 text-slate-900"
          }`}
        />

        <div
          className={`border rounded max-h-72 overflow-y-auto ${
            isDark
              ? "border-slate-700 bg-slate-950"
              : "border-slate-300 bg-white"
          }`}
        >
          <div
            className={`px-3 py-2 text-xs border-b ${
              isDark
                ? "text-slate-400 border-slate-700 bg-slate-900"
                : "text-slate-500 border-slate-200 bg-slate-50"
            }`}
          >
            {searchQuery.trim()
              ? "Matching tenants in this room"
              : "All tenants in this room"}
          </div>

          {suggestions.length > 0 ? (
            suggestions.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => handleSelectTenant(t)}
                className={`w-full text-left p-3 border-b last:border-b-0 transition-colors ${
                  isDark
                    ? "border-slate-800 hover:bg-slate-900"
                    : "border-slate-200 hover:bg-amber-50"
                } ${
                  selectedTenant?.id === t.id
                    ? isDark
                      ? "bg-amber-950/40"
                      : "bg-amber-50"
                    : ""
                }`}
              >
                <div className="font-medium">{t.fullName}</div>
                <div
                  className={`text-sm ${isDark ? "text-slate-300" : "text-gray-500"}`}
                >
                  {t.email}
                </div>
                <div
                  className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}
                >
                  {t.age} years • {t.gender} • {t.phone || "No phone"}
                </div>
              </button>
            ))
          ) : (
            <div
              className={`px-4 py-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {searchQuery.trim()
                ? "No tenant in this room matches your search"
                : "This room has no tenants"}
            </div>
          )}
        </div>

        {selectedTenant && (
          <div
            className={`p-3 rounded text-sm border ${
              isDark
                ? "bg-rose-950/30 border-rose-900/40 text-rose-200"
                : "bg-red-50 border-red-100 text-slate-800"
            }`}
          >
            Selected: <strong>{selectedTenant.fullName}</strong>
          </div>
        )}

        <div
          className={`flex justify-end gap-3 pt-3 border-t ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <button
            onClick={handleClose}
            className={`border px-4 py-2 rounded ${
              isDark
                ? "border-slate-600 text-slate-200 hover:bg-slate-800"
                : "border-slate-300 text-slate-800 hover:bg-slate-100"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTenant || loading}
            className="bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 active:bg-amber-700 border border-amber-500 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
