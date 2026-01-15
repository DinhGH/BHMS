import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import SearchInput from "../components/SearchInput";
import api from "../server/api";

export default function BoardingHouseManagement() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHouses();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await api.get(`/owner/boarding-houses${query}`);
      setHouses(data);
    } catch (error) {
      console.error("Fetch boarding houses error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search boarding house..."
          className="sm:max-w-sm"
        />

        <div className="flex  justify-between gap-2">
          <button className="px-4 py-2 text-sm border rounded-md">
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-md">
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading...</div>
      ) : houses.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          No boarding houses found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {houses.map((house) => (
            <div
              key={house.id}
              className="bg-white rounded-lg border shadow-sm overflow-hidden"
            >
              <div className="h-36 bg-slate-200 flex items-center justify-center">
                <div className="w-14 h-14 border-2 border-slate-300" />
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-semibold">{house.name}</h3>

                <div className="text-sm text-slate-600 space-y-1">
                  <div>Total Rooms : {house.totalRooms}</div>
                  <div>Occupied : {house.occupied}</div>
                  <div>Available : {house.available}</div>
                </div>

                <button className="text-sm font-medium hover:underline">
                  View Detail →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
