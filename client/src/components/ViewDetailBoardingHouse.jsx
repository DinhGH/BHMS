import { useEffect, useState, useMemo, useCallback } from "react";
import { getRoomsByHouse } from "../services/boardingHouse.js";
import SearchInput from "./ui/SearchInput.jsx";
import Pagination from "./ui/Pagination.jsx";
import Loading from "./loading.jsx";
import ViewDetailRoom from "./ViewDetailRoom.jsx";
import RoomFormModal from "./RoomFormModel.jsx";
import RoomFilter from "./RoomFilter.jsx";

export default function ViewDetailBoardingHouse({ house, onBack }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [openAddRoom, setOpenAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

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
  const fetchRooms = useCallback(async () => {
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

      const data = await getRoomsByHouse(house.id, params);
      setRooms(data);
      setLoadError("");
    } catch (err) {
      setLoadError(err?.message || "Failed to load rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [filters, house.id]);

  // Fetch when filters change
  useEffect(() => {
    fetchRooms();
    setCurrentPage(1);
  }, [fetchRooms]);

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
  const occupiedCount = rooms.filter((room) => room.currentOccupants > 0).length;
  const emptyCount = rooms.filter((room) => room.currentOccupants === 0).length;
  const paidCount = rooms.filter((room) => room.paymentStatus === "PAID").length;

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
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-white border rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="px-3 py-1.5 border rounded-md text-sm hover:bg-slate-100"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {house.name} - Room Management
              </h2>
              <p className="text-sm text-gray-500 mt-1">{house.address}</p>
            </div>
          </div>

          <button
            onClick={() => setOpenAddRoom(true)}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            + Add New Room
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">Total Rooms</div>
            <div className="text-xl font-semibold text-slate-900">{rooms.length}</div>
          </div>
          <div className="rounded-lg border bg-emerald-50 px-4 py-3">
            <div className="text-xs text-emerald-600">Occupied</div>
            <div className="text-xl font-semibold text-emerald-900">{occupiedCount}</div>
          </div>
          <div className="rounded-lg border bg-blue-50 px-4 py-3">
            <div className="text-xs text-blue-600">Empty</div>
            <div className="text-xl font-semibold text-blue-900">{emptyCount}</div>
          </div>
          <div className="rounded-lg border bg-violet-50 px-4 py-3">
            <div className="text-xs text-violet-600">Paid Rooms</div>
            <div className="text-xl font-semibold text-violet-900">{paidCount}</div>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room by name..."
            className="sm:max-w-sm"
          />

          <div className="flex gap-3">
            <RoomFilter
              key={`${filters.priceRange?.min}-${filters.roomStatus}-${filters.paymentStatus}`}
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        </div>

        <RoomFormModal
          open={openAddRoom}
          houseId={house.id}
          roomData={editingRoom}
          onClose={() => {
            setOpenAddRoom(false);
            setEditingRoom(null);
          }}
          onSuccess={fetchRooms}
        />

        {loadError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Failed to load rooms: {loadError}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <Loading isLoading={loading} />
      {!loading &&
        (filteredRooms.length === 0 ? (
          <div className="bg-white border rounded-xl py-12 text-center text-slate-500">
            No rooms found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedRooms.map((room) => {
                const isOccupied = room.currentOccupants > 0;
                const statusColor = isOccupied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600";
                const paymentColor =
                  room.paymentStatus === "OVERDUE"
                    ? "bg-red-100 text-red-700"
                    : room.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600";

                return (
                  <div
                    key={room.id}
                    className="bg-white border rounded-xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={
                          room.imageUrl && room.imageUrl.startsWith("http")
                            ? room.imageUrl
                            : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop"
                        }
                        className="w-full h-40 object-cover hover:scale-105 transition duration-300"
                      />
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{room.name}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor}`}>
                          {isOccupied ? "Occupied" : "Empty"}
                        </span>
                      </div>

                      <div className="text-sm text-slate-600 space-y-2">
                        <div className="flex justify-between">
                          <span>Rent</span>
                          <span className="font-medium text-slate-900">${room.price} / month</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Payment</span>
                          <span
                            className={`ml-2 inline-flex text-xs font-medium px-2 py-1 rounded-full ${paymentColor}`}
                          >
                            {renderInvoiceStatus(room.paymentStatus)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Occupants</span>
                          <span className="font-medium text-slate-900">{room.currentOccupants}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => setSelectedRoomId(room.id)}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          View Detail
                        </button>
                        <button
                          onClick={() => {
                            setEditingRoom(room);
                            setOpenAddRoom(true);
                          }}
                          className="text-sm font-medium text-amber-600 hover:underline"
                        >
                          Edit Room
                        </button>
                      </div>
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
        ))}
    </div>
  );
}
