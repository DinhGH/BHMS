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
  const [loadError, setLoadError] = useState("");
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
      setLoadError("");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Cannot load boarding houses";
      toast.error(message);
      setLoadError(message);
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
  const totalRooms = houses.reduce((sum, house) => sum + (house.totalRooms || 0), 0);
  const totalOccupied = houses.reduce((sum, house) => sum + (house.occupied || 0), 0);
  const totalAvailable = houses.reduce((sum, house) => sum + (house.available || 0), 0);
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
          <div className="bg-white border rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Boarding House Management</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your houses, rooms, and occupancy status in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                  onClick={() => setOpenDeleteModal(true)}
                >
                  Delete House
                </button>
                <button
                  className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition shadow"
                  onClick={() => setOpenModal(true)}
                >
                  + Add New House
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-500">Houses Found</div>
                <div className="text-xl font-semibold text-slate-900">{houses.length}</div>
              </div>
              <div className="rounded-lg border bg-blue-50 px-4 py-3">
                <div className="text-xs text-blue-600">Total Rooms</div>
                <div className="text-xl font-semibold text-blue-900">{totalRooms}</div>
              </div>
              <div className="rounded-lg border bg-emerald-50 px-4 py-3">
                <div className="text-xs text-emerald-600">Occupancy</div>
                <div className="text-xl font-semibold text-emerald-900">
                  {totalOccupied}/{Math.max(totalOccupied + totalAvailable, 0)}
                </div>
              </div>
            </div>

            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boarding house by name or address..."
              className="sm:max-w-md"
            />

            {loadError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Failed to load boarding houses: {loadError}
              </div>
            )}
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
                          <p className="text-sm text-slate-500">{house.address}</p>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                            <div className="rounded-md bg-slate-50 px-2 py-2 border">
                              <div className="text-slate-500">Rooms</div>
                              <div className="font-semibold text-slate-800">{house.totalRooms}</div>
                            </div>
                            <div className="rounded-md bg-emerald-50 px-2 py-2 border">
                              <div className="text-emerald-600">Occupied</div>
                              <div className="font-semibold text-emerald-800">{house.occupied}</div>
                            </div>
                            <div className="rounded-md bg-blue-50 px-2 py-2 border">
                              <div className="text-blue-600">Available</div>
                              <div className="font-semibold text-blue-800">{house.available}</div>
                            </div>
                          </div>
                          <div className="flex justify-between pt-2">
                            <button
                              className="text-sm font-medium text-blue-600 hover:underline"
                              onClick={() => setSelectedHouse(house)}
                            >
                              View Detail
                            </button>
                            <button
                              className="text-sm font-medium text-amber-600 hover:underline"
                              onClick={() => {
                                setEditingHouse(house);
                                setOpenEditModal(true);
                              }}
                            >
                              Edit House
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
