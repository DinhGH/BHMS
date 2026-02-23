import { useEffect, useState, useMemo } from "react";
import api from "../server/api.js";
import SearchInput from "./ui/SearchInput.jsx";
import Pagination from "./ui/Pagination.jsx";
import ViewDetailRoom from "./ViewDetailRoom.jsx";
import AddNewRoomModal from "./AddNewRoomModel.jsx";
import RoomFilter from "./RoomFilter.jsx";

export default function ViewDetailBoardingHouse({ house, onBack }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [openAddRoom, setOpenAddRoom] = useState(false);

  const [filters, setFilters] = useState({
    priceRange: null,
    roomStatus: "ALL",
    paymentStatus: "ALL",
  });

  const pageSize = 12;

  const renderInvoiceStatus = (status) => {
    switch (status) {
      case "NO_TENANT":
        return "No tenant rented";
      case "NO_INVOICE":
        return "No invoice created";
      case "PENDING":
        return "Unpaid";
      case "PAID":
        return "Paid";
      case "OVERDUE":
        return "Overdue";
      default:
        return "-";
    }
  };

  /* ================= FETCH ================= */
  const fetchRooms = async () => {
    try {
      setLoading(true);

      const params = {};

      if (filters.priceRange) {
        params.minPrice = filters.priceRange.min;
        params.maxPrice = filters.priceRange.max;
      }

      if (filters.roomStatus !== "ALL") {
        params.status = filters.roomStatus;
      }

      if (filters.paymentStatus !== "ALL") {
        params.paymentStatus = filters.paymentStatus;
      }

      console.log("Fetching with params:", params); // Debug log

      const data = await api.get(
        `/api/owner/boarding-houses/${house.id}/rooms`,
        {
          params,
        },
      );

      console.log("Received rooms:", data); // Debug log
      setRooms(data);
    } catch (err) {
      console.error("Fetch rooms error", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters change
  useEffect(() => {
    console.log("Filters changed:", filters); // Debug log
    fetchRooms();
    setCurrentPage(1);
  }, [filters, house.id]);

  /* ================= SEARCH (CLIENT) ================= */
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

  /* ================= DETAIL ================= */
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

  /* ================= UI ================= */
  return (
    <div className="space-y-4">
      {/* HEADER */}
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

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room..."
          className="sm:max-w-sm"
        />

        <div className="flex gap-4">
          <RoomFilter
            key={`${filters.priceRange?.min}-${filters.roomStatus}-${filters.paymentStatus}`}
            filters={filters}
            setFilters={setFilters}
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
          houseId={house.id}
          onClose={() => setOpenAddRoom(false)}
          onSuccess={fetchRooms}
        />
      </div>

      {/* DEBUG INFO
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        Active filters: Price:{" "}
        {filters.priceRange
          ? `${filters.priceRange.min}-${filters.priceRange.max}`
          : "All"}{" "}
        | Status: {filters.roomStatus} | Payment: {filters.paymentStatus} |
        Results: {filteredRooms.length} rooms
      </div> */}

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No rooms found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedRooms.map((room) => {
              const isOccupied = room.currentOccupants > 0;

              return (
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
                        Status:{" "}
                        <span
                          className={
                            isOccupied ? "text-green-600" : "text-slate-400"
                          }
                        >
                          {isOccupied ? "Occupied" : "Empty"}
                        </span>
                      </div>
                      <div>
                        Payment:{" "}
                        <span
                          className={
                            room.paymentStatus === "OVERDUE"
                              ? "text-red-500"
                              : room.paymentStatus === "PAID"
                                ? "text-green-600"
                                : "text-slate-400"
                          }
                        >
                          {renderInvoiceStatus(room.paymentStatus)}
                        </span>
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
              );
            })}
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
