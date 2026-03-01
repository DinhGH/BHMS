import { useState, useEffect } from "react";
import { searchTenants, addTenantToRoom } from "../services/boardingHouse.js";
import { toast } from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext";

export default function AddTenantModal({ open, roomId, onClose, onAdded }) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  /* ================= SEARCH TENANTS ================= */
  useEffect(() => {
    if (!open) {
      return;
    }

    if (selectedTenant && searchQuery === selectedTenant.fullName) {
      return;
    }

    const timer = setTimeout(
      async () => {
        try {
          setSearching(true);
          const tenants = await searchTenants(searchQuery.trim());
          setSuggestions(tenants);
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setSearching(false);
        }
      },
      searchQuery.trim() ? 300 : 0,
    );

    return () => clearTimeout(timer);
  }, [open, searchQuery, selectedTenant]);

  /* ================= SELECT TENANT ================= */
  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
    setSearchQuery(tenant.fullName);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!selectedTenant) {
      toast.error("Please select a tenant from the suggestions");
      return;
    }

    try {
      setLoading(true);

      await addTenantToRoom(roomId, selectedTenant.id);

      toast.success(`${selectedTenant.fullName} added to room successfully`);
      onAdded();
      onClose();

      // Reset
      setSearchQuery("");
      setSelectedTenant(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add tenant");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET ================= */
  const handleClose = () => {
    setSearchQuery("");
    setSelectedTenant(null);
    setSuggestions([]);
    onClose();
  };

  if (!open) return null;

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div
        className={`p-6 rounded-lg w-full max-w-lg space-y-4 border shadow-xl ${
          isDark
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <h2 className="text-lg font-semibold">Add Tenant to Room</h2>

        {/* Search Input */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-slate-200" : "text-slate-800"
            }`}
          >
            Search Tenant <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTenant(null); // Reset selection when typing
            }}
            className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isDark
                ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
                : "bg-white border-slate-300 text-slate-900"
            }`}
            placeholder="Type tenant name or email..."
          />

          <div
            className={`mt-2 border rounded-md max-h-56 overflow-y-auto ${
              isDark
                ? "bg-slate-950 border-slate-700"
                : "bg-white border-slate-300"
            }`}
          >
            {searching && (
              <div
                className={`px-4 py-3 text-sm ${
                  isDark ? "text-slate-400" : "text-gray-500"
                }`}
              >
                Searching...
              </div>
            )}

            {!searching && suggestions.length > 0 && (
              <>
                <div
                  className={`px-4 py-2 text-xs border-b ${
                    isDark
                      ? "text-slate-400 border-slate-700 bg-slate-900"
                      : "text-gray-500 border-slate-200 bg-gray-50"
                  }`}
                >
                  {searchQuery.trim()
                    ? "Matching tenants without room"
                    : "Tenants without room"}
                </div>
                {suggestions.map((tenant) => (
                  <button
                    type="button"
                    key={tenant.id}
                    onClick={() => handleSelectTenant(tenant)}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                      isDark
                        ? "border-slate-800 hover:bg-slate-900"
                        : "border-slate-200 hover:bg-blue-50"
                    } ${
                      selectedTenant?.id === tenant.id
                        ? isDark
                          ? "bg-sky-950/40"
                          : "bg-blue-50"
                        : ""
                    }`}
                  >
                    <div
                      className={`font-medium ${
                        isDark ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      {tenant.fullName}
                    </div>
                    <div
                      className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-500"
                      }`}
                    >
                      {tenant.email}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        isDark ? "text-slate-400" : "text-gray-400"
                      }`}
                    >
                      {tenant.age} years • {tenant.gender} •{" "}
                      {tenant.phone || "No phone"}
                    </div>
                  </button>
                ))}
              </>
            )}

            {!searching && suggestions.length === 0 && (
              <div
                className={`px-4 py-3 text-sm ${
                  isDark ? "text-slate-400" : "text-gray-500"
                }`}
              >
                {searchQuery.trim()
                  ? "No tenants without room match this search"
                  : "No tenants without room available"}
              </div>
            )}
          </div>
        </div>

        {/* Selected Tenant Info */}
        {selectedTenant && (
          <div>
            <div
              className={`p-4 rounded-md border ${
                isDark
                  ? "bg-slate-950 border-sky-900"
                  : "bg-white border-blue-200"
              }`}
            >
              <div
                className={`text-sm font-medium mb-2 ${
                  isDark ? "text-sky-300" : "text-blue-900"
                }`}
              >
                Selected Tenant:
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Name:</strong> {selectedTenant.fullName}
                </div>
                <div>
                  <strong>Email:</strong> {selectedTenant.email}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedTenant.phone || "N/A"}
                </div>
                <div>
                  <strong>Age:</strong> {selectedTenant.age} •
                  <strong> Gender:</strong> {selectedTenant.gender}
                </div>
              </div>
            </div>
            <div
              className={`p-3 rounded text-sm mt-4 border ${
                isDark
                  ? "bg-rose-950/30 border-rose-900/40 text-rose-200"
                  : "bg-red-50 border-red-100 text-slate-800"
              }`}
            >
              Selected: <strong>{selectedTenant.fullName}</strong>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div
          className={`text-xs italic ${
            isDark ? "text-slate-400" : "text-gray-500"
          }`}
        >
          💡 Only tenants who do not have a room are shown in this list.
        </div>

        {/* Actions */}
        <div
          className={`flex justify-end gap-3 pt-4 border-t ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <button
            onClick={handleClose}
            disabled={loading}
            className={`border px-4 py-2 rounded disabled:opacity-50 ${
              isDark
                ? "border-slate-600 text-slate-200 hover:bg-slate-800"
                : "border-slate-300 text-slate-800 hover:bg-gray-100"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTenant || loading}
            className={`px-4 py-2 rounded text-white ${
              selectedTenant && !loading
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Adding..." : "Add Tenant"}
          </button>
        </div>
      </div>
    </div>
  );
}
