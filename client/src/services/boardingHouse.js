import api from "./api";

/* ================= GET ALL ================= */
export const getBoardingHouses = (search = "") => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get(`/api/owner/boarding-houses${query}`);
};

/* ================= CHECK BY NAME ================= */
export const checkBoardingHouseByName = (name) => {
  return api.get(
    `/api/owner/boarding-houses/check?name=${encodeURIComponent(name.trim())}`,
  );
};

/* ================= CREATE ================= */
export const createBoardingHouse = (formData) => {
  return api.post("/api/owner/boarding-houses", formData);
};

/* ================= UPDATE ================= */
export const updateBoardingHouse = (id, formData) => {
  return api.put(`/api/owner/boarding-houses/${id}`, formData);
};

/* ================= DELETE ================= */
export const deleteBoardingHouseByName = (name) => {
  return api.delete(
    `/api/owner/boarding-houses?name=${encodeURIComponent(name.trim())}`,
  );
};
/* ================== ROOMS ================== */
// Lấy tất cả phòng theo nhà trọ với tham số lọc
export const getRoomsByHouse = (houseId, params = {}) => {
  return api.get(`/api/owner/boarding-houses/${houseId}/rooms`, { params });
};
// Lấy chi tiết phòng theo ID
export const getRoomDetail = (roomId) => {
  return api.get(`/api/owner/rooms/${roomId}`);
};
// Tạo phòng
export const createRoom = (formData) => {
  return api.post("/api/owner/rooms", formData);
};

// Cập nhật phòng + ảnh
export const updateRoomDetails = (roomId, formData) => {
  return api.put(`/api/owner/rooms/${roomId}/details`, formData);
};

// Thêm người thuê vào phòng
export const addTenantToRoom = (roomId, tenantId) => {
  return api.post(`/api/owner/rooms/${roomId}/add-tenant`, { tenantId });
};
// Xóa phòng
export const deleteRoom = (roomId) => {
  return api.delete(`/api/owner/rooms/${roomId}`);
};

/* ================== TENANTS ================== */
// Tìm kiếm người thuê theo tên
export const searchTenants = (query) => {
  return api.get("/api/owner/tenants/search", {
    params: { query },
  });
};
// Xóa người thuê khỏi phòng
export const removeTenantFromRoom = (roomId, tenantId) => {
  return api.delete(`/api/owner/rooms/${roomId}/tenants/${tenantId}`);
};
// Tìm kiếm người thuê trong phòng theo tên
export const searchTenantsInRoom = (roomId, query) => {
  return api.get(`/api/owner/rooms/${roomId}/tenants/search`, {
    params: { query },
  });
};
/* ================== CONTRACTS ================== */
export const updateContract = (formData, roomId) => {
  return api.put(`/api/owner/rooms/${roomId}/contract`, formData);
};
