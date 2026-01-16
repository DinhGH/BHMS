import { useEffect, useState } from "react";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import api from "../server/api.js";
import BoardingHouseFormModal from "./BoardingHouseFormModal.jsx";
import RoomManagement from "./ViewDetailBoardingHouse.jsx";
import "../index.css";

export default function BoardingHouseManagement({ ownerId }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHouse, setSelectedHouse] = useState(null);

  const [openModal, setOpenModal] = useState(false);

  const pageSize = 8;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHouses();
      setCurrentPage(1);
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

  // Pagination logic
  const totalPages = Math.ceil(houses.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedHouses = houses.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      {/* Nếu đang xem Room */}
      {selectedHouse ? (
        <RoomManagement
          house={selectedHouse}
          onBack={() => setSelectedHouse(null)}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boarding house..."
              className="sm:max-w-sm"
            />
            <div className="flex gap-6">
              <button className="px-4 py-2 text-sm border rounded-md">
                Filter
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-300 hover:bg-blue-500 text-white rounded-md"
                onClick={() => setOpenModal(true)}
              >
                Add New
              </button>
            </div>
          </div>

          <BoardingHouseFormModal
            open={openModal}
            ownerId={ownerId}
            onClose={() => setOpenModal(false)}
            onSuccess={fetchHouses}
          />

          {/* Content */}
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading...</div>
          ) : houses.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No boarding houses found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedHouses.map((house) => (
                  <div
                    key={house.id}
                    className="bg-white rounded-lg border shadow-sm overflow-hidden"
                  >
                    <div
                      className="apple-card"
                      onMouseMove={(e) => {
                        const card = e.currentTarget;
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = -(y - centerY) / 14;
                        const rotateY = (x - centerX) / 14;
                        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)`;
                      }}
                    >
                      <img
                        src={house.image || "/no-image.png"}
                        alt={house.name}
                        className="apple-card-image"
                      />
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold">{house.name}</h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>Total Rooms: {house.totalRooms}</div>
                        <div>Occupied: {house.occupied}</div>
                        <div>Available: {house.available}</div>
                      </div>

                      <button
                        className="text-sm font-medium hover:underline"
                        onClick={() => setSelectedHouse(house)}
                      >
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
        </>
      )}
    </div>
  );
}
