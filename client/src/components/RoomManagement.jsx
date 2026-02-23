import { useEffect, useMemo, useState } from "react";
import SearchInput from "./ui/SearchInput.jsx";
import Pagination from "./ui/Pagination.jsx";
import ViewDetailRoom from "./ViewDetailRoom.jsx";
import AddNewRoomModal from "./AddNewRoomModel.jsx";
import api from "../server/api.js";

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [openAddRoom, setOpenAddRoom] = useState(false);

  const pageSize = 12;

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await api.get("/api/owner/rooms");
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch rooms error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    return rooms.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [rooms, search]);

  const totalPages = Math.ceil(filteredRooms.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRooms = filteredRooms.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (selectedRoomId) {
    return (
      <ViewDetailRoom
        roomId={selectedRoomId}
        onBack={(refresh = false) => {
          setSelectedRoomId(null);
          if (refresh) fetchRooms();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room..."
          className="sm:max-w-sm"
        />
        <button
          onClick={() => setOpenAddRoom(true)}
          className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
        >
          Add New
        </button>
      </div>

      <AddNewRoomModal
        open={openAddRoom}
        onClose={() => setOpenAddRoom(false)}
        onSuccess={fetchRooms}
      />

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No rooms found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white border rounded-lg shadow hover:shadow-xl"
              >
                <img
                  src={
                    room.imageUrl && room.imageUrl.startsWith("http")
                      ? room.imageUrl
                      : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop"
                  }
                  className="w-full h-40 object-cover"
                />

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold">{room.name}</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>Rent: ${room.price} / Month</div>
                    <div>
                      House: {room.houseName ? room.houseName : "Unassigned"}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRoomId(room.id)}
                    className="text-sm font-medium hover:underline"
                  >
                    View Detail →
                  </button>
                </div>
              </div>
            ))}
          </div>

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
