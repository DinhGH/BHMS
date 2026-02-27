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
import toast from "react-hot-toast";
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

  /* =========================
     FETCH HOUSES
  ========================= */
  const fetchHouses = async () => {
    if (search.length > 100) {
      toast.error("Search text is too long (max 100 characters).");
      return;
    }

    try {
      setLoading(true);
      const data = await getBoardingHouses(search);
      setHouses(data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Cannot load boarding houses";
      toast.error(message);
      setHouses([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SEARCH DEBOUNCE
  ========================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchHouses();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  /* =========================
     PAGINATION
  ========================= */
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
      {selectedHouse ? (
        <RoomManagement
          house={selectedHouse}
          onBack={() => setSelectedHouse(null)}
        />
      ) : (
        <>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boarding house..."
              className="sm:max-w-sm"
            />
            <div className="flex gap-3">
              <button
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                onClick={() => setOpenDeleteModal(true)}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition shadow"
                onClick={() => setOpenModal(true)}
              >
                + Add New
              </button>
            </div>
          </div>

          {/* MODALS */}
          <AddNewBoardingHouseModal
            open={openModal}
            ownerId={ownerId}
            onClose={() => setOpenModal(false)}
            onSuccess={() => {
              fetchHouses();
            }}
          />

          <DeleteHouseModal
            open={openDeleteModal}
            onClose={() => setOpenDeleteModal(false)}
            houses={houses}
            onDelete={handleDelete}
          />

          {/* CONTENT */}
          <Loading isLoading={loading} />

          {!loading && (
            <>
              {houses.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-lg">
                  🏠 No boarding houses found
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {paginatedHouses.map((house) => (
                      <div
                        key={house.id}
                        className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-xl transition duration-300"
                      >
                        <div className="overflow-hidden">
                          <img
                            src={
                              house.imageUrl &&
                              house.imageUrl.startsWith("http")
                                ? house.imageUrl
                                : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
                            }
                            alt={house.name}
                            className="w-full h-44 object-cover hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold text-lg text-gray-800">
                            {house.name}
                          </h3>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div>Total Rooms: {house.totalRooms}</div>
                            <div>Occupied: {house.occupied}</div>
                            <div>Available: {house.available}</div>
                          </div>
                          <div className="flex justify-between pt-2">
                            <button
                              className="text-sm font-medium text-blue-600 hover:underline"
                              onClick={() => setSelectedHouse(house)}
                            >
                              View Detail →
                            </button>
                            <button
                              className="text-sm font-medium text-amber-600 hover:underline"
                              onClick={() => {
                                setEditingHouse(house);
                                setOpenEditModal(true);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <EditBoardingHouseModal
                    open={openEditModal}
                    house={editingHouse}
                    onClose={() => setOpenEditModal(false)}
                    onSuccess={() => {
                      fetchHouses();
                    }}
                  />

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
        </>
      )}
    </div>
  );
}
