import { useEffect, useState } from "react";
import SearchInput from "./ui/SearchInput.jsx";
import Pagination from "./ui/Pagination.jsx";
import {
  getBoardingHouses,
  deleteBoardingHouseByName,
} from "../services/boardingHouse.js";
import AddNewBoardingHouseModal from "./AddNewBoardingHouseModal.jsx";
import RoomManagement from "./ViewDetailBoardingHouse.jsx";
import DeleteHouseModal from "./DeleteHouseModal.jsx";
import EditBoardingHouseModal from "./EditBoardingHouseModal.jsx";
import Loading from "./loading.jsx";
import "../index.css";

export default function BoardingHouseManagement({ ownerId }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHouse, setSelectedHouse] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);

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
      const data = await getBoardingHouses(search);
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
  // Pagination logic
  //handle delete by name
  const handleDelete = async (houseName) => {
    try {
      await deleteBoardingHouseByName(houseName);
      await fetchHouses();
    } catch (error) {
      console.error("Delete error", error);
      throw error; // 👈 QUAN TRỌNG
    }
  };

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
              <button
                className="flex px-4 py-2 text-sm bg-gray-300 hover:bg-red-500 text-white border rounded-md"
                onClick={() => {
                  setOpenDeleteModal(true);
                }}
              >
                Delete
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-300 hover:bg-blue-500 text-white rounded-md"
                onClick={() => setOpenModal(true)}
              >
                Add New
              </button>
            </div>
          </div>

          <AddNewBoardingHouseModal
            open={openModal}
            ownerId={ownerId}
            onClose={() => setOpenModal(false)}
            onSuccess={fetchHouses}
          />
          <DeleteHouseModal
            open={openDeleteModal}
            onClose={() => setOpenDeleteModal(false)}
            houses={houses}
            onDelete={handleDelete}
          />

          {/* Content */}
          <Loading isLoading={loading} />
          {!loading &&
            (houses.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No boarding houses found
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ">
                  {paginatedHouses.map((house) => (
                    <div
                      key={house.id}
                      className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-2xl"
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
                          src={
                            house.imageUrl && house.imageUrl.startsWith("http")
                              ? house.imageUrl
                              : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
                          }
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
                        <div className="flex justify-between">
                          <button
                            className="text-sm font-medium hover:underline"
                            onClick={() => setSelectedHouse(house)}
                          >
                            View Detail →
                          </button>
                          <button
                            className="text-sm font-medium hover:underline pr-4"
                            onClick={() => {
                              setEditingHouse(house);
                              setOpenEditModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <EditBoardingHouseModal
                            open={openEditModal}
                            house={editingHouse}
                            onClose={() => setOpenEditModal(false)}
                            onSuccess={fetchHouses}
                          />
                        </div>
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
            ))}
        </>
      )}
    </div>
  );
}
