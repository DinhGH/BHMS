import { useEffect, useState, useMemo } from "react";
import api from "../server/api.js";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";

export default function ViewDetailBoardingHouse({ house, onBack }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 12;

  useEffect(() => {
    fetchRooms();
    setCurrentPage(1);
  }, [house.id]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/owner/boarding-houses/${house.id}/rooms`);
      setRooms(data);
    } catch (err) {
      console.error("Fetch rooms error", err);
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     SEARCH LOGIC
  ====================== */
  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;

    return rooms.filter((room) =>
      room.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [rooms, search]);

  /* ======================
     PAGINATION LOGIC
  ====================== */
  const totalPages = Math.ceil(filteredRooms.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRooms = filteredRooms.slice(startIndex, startIndex + pageSize);

  /* reset page when search */
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-3 py-1 border rounded-md text-sm"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold">
          {house.name} – Room Management
        </h2>
      </div>

      {/* Search + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room..."
          className="sm:max-w-sm"
        />

        <div className="flex gap-6">
          <button className="px-4 py-2 text-sm border rounded-md">
            Filter
          </button>
          <button className="px-4 py-2 text-sm bg-gray-300 hover:bg-blue-500 text-white rounded-md">
            Add New
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No rooms found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white border rounded-lg shadow-sm overflow-hidden"
              >
                <div className="h-32 bg-slate-200 flex items-center justify-center">
                  Picture
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold">{room.name}</h3>

                  <div className="text-sm text-slate-600 space-y-1">
                    <div>Rent: ${room.price} / Month</div>
                    <div>
                      Occupants: {room.currentOccupants}/{room.maxOccupants}
                    </div>
                    <div
                      className={
                        room.paymentStatus === "OVERDUE"
                          ? "text-red-500"
                          : "text-green-600"
                      }
                    >
                      Payment: {room.paymentStatus}
                    </div>
                    <div>Contract Ends: {room.contractEnd}</div>
                  </div>

                  <button className="text-sm font-medium hover:underline">
                    View Detail →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
