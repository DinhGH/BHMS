import { useState, useEffect } from "react";
import { searchTenants, addTenantToRoom } from "../services/boardingHouse.js";
import { toast } from "react-hot-toast";

export default function AddTenantModal({ open, roomId, onClose, onAdded }) {
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

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const tenants = await searchTenants(searchQuery.trim());
        setSuggestions(tenants);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, searchQuery.trim() ? 300 : 0);

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
      <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4">
        <h2 className="text-lg font-semibold">Add Tenant to Room</h2>

        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Search Tenant <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTenant(null); // Reset selection when typing
            }}
            className="w-full border p-2 rounded"
            placeholder="Type tenant name or email..."
          />

          <div className="mt-2 border rounded-md max-h-56 overflow-y-auto bg-white">
            {searching && (
              <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
            )}

            {!searching && suggestions.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">
                  {searchQuery.trim()
                    ? "Matching tenants without room"
                    : "Tenants without room"}
                </div>
                {suggestions.map((tenant) => (
                  <button
                    type="button"
                    key={tenant.id}
                    onClick={() => handleSelectTenant(tenant)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 ${
                      selectedTenant?.id === tenant.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-medium">{tenant.fullName}</div>
                    <div className="text-sm text-gray-500">{tenant.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {tenant.age} years • {tenant.gender} •{" "}
                      {tenant.phone || "No phone"}
                    </div>
                  </button>
                ))}
              </>
            )}

            {!searching && suggestions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500">
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
            <div className="bg-white p-4 rounded-md border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-2">
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
            <div className="bg-red-50 p-3 rounded text-sm mt-4">
              Selected: <strong>{selectedTenant.fullName}</strong>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 italic">
          💡 Only tenants who do not have a room are shown in this list.
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="border px-4 py-2 rounded hover:bg-gray-100"
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
