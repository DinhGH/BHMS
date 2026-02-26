import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import SearchInput from "./ui/SearchInput.jsx";
import Pagination from "./ui/Pagination.jsx";
import ViewDetailRoom from "./ViewDetailRoom.jsx";
import AddNewRoomModal from "./AddNewRoomModel.jsx";
import Loading from "./loading.jsx";
import api from "../server/api.js";

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [openAddRoom, setOpenAddRoom] = useState(false);
  const [fetching, setFetching] = useState(false);

  const pageSize = 12;

  // ================= FETCH ROOMS =================
  const fetchRooms = async (showToast = false) => {
    try {
      setLoading(true);
      setFetching(true);

      if (showToast) {
        toast.loading("Loading rooms...", { id: "rooms-loading" });
      }

      const data = await api.get("/api/owner/rooms");

      // API safety (tránh crash nếu backend trả sai format)
      if (!Array.isArray(data)) {
        console.warn("Rooms API returned non-array:", data);
        setRooms([]);
        toast.error("Invalid room data format", { id: "rooms-loading" });
        return;
      }

      setRooms(data);

      if (showToast) {
        toast.success("Rooms loaded successfully", {
          id: "rooms-loading",
        });
      }
    } catch (err) {
      console.error("Fetch rooms error:", err);

      // Hiển thị lỗi thân thiện thay vì im lặng
      const message =
        err?.response?.data?.message || err?.message || "Failed to fetch rooms";

      toast.error(message, { id: "rooms-loading" });
      setRooms([]);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchRooms(true);
  }, []);

  // ================= SEARCH (OPTIMIZED) =================
  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rooms;

    return rooms.filter((r) => {
      const name = r?.name?.toLowerCase() || "";
      const houseName = r?.houseName?.toLowerCase() || "";
      return name.includes(keyword) || houseName.includes(keyword);
    });
  }, [rooms, search]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ================= PAGINATION =================
  const totalPages = Math.ceil(filteredRooms.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRooms = filteredRooms.slice(startIndex, startIndex + pageSize);

  // ================= VIEW DETAIL =================
  if (selectedRoomId) {
    return (
      <ViewDetailRoom
        roomId={selectedRoomId}
        onBack={(refresh = false) => {
          setSelectedRoomId(null);
          if (refresh) fetchRooms(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room by name or house..."
          className="sm:max-w-sm"
        />

        <button
          onClick={() => setOpenAddRoom(true)}
          disabled={fetching}
          className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md transition"
        >
          Add New Room
        </button>
      </div>

      {/* ADD ROOM MODAL */}
      <AddNewRoomModal
        open={openAddRoom}
        onClose={() => setOpenAddRoom(false)}
        onSuccess={() => {
          setOpenAddRoom(false);
          fetchRooms(true);
          toast.success("Room added successfully");
        }}
      />

      {/* LOADING */}
      <Loading isLoading={loading} />

      {/* CONTENT */}
      {!loading && (
        <>
          {filteredRooms.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-lg">
              No rooms found
            </div>
          ) : (
            <>
              {/* GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {paginatedRooms.map((room) => {
                  const image =
                    room?.imageUrl && room.imageUrl.startsWith("http")
                      ? room.imageUrl
                      : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop";

                  return (
                    <div
                      key={room.id}
                      className="bg-white border rounded-lg shadow hover:shadow-xl transition duration-200"
                    >
                      <img
                        src={image}
                        alt={room?.name || "Room"}
                        className="w-full h-40 object-cover rounded-t-lg"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop";
                        }}
                      />

                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {room?.name || "Unnamed Room"}
                        </h3>

                        <div className="text-sm text-slate-600 space-y-1">
                          <div>
                            Rent:{" "}
                            <span className="font-medium">
                              ${room?.price ?? 0} / Month
                            </span>
                          </div>

                          <div>
                            House:{" "}
                            <span className="font-medium">
                              {room?.houseName || "Unassigned"}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedRoomId(room.id)}
                          className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                        >
                          View Detail →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
