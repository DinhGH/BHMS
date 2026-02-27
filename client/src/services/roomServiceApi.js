import api from "../services/api";

/* ================== SERVICES ================== */

export const getServices = () => {
  return api.get("/api/owner/services");
};
export const getRoomServicesApi = (roomId) =>
  api.get(`/api/owner/rooms/${roomId}/services`);

export const addServiceToRoomApi = (roomId, data) =>
  api.post(`/api/owner/rooms/${roomId}/services`, data);

export const removeServiceFromRoomApi = (roomId, serviceId) =>
  api.delete(`/api/owner/rooms/${roomId}/services/${serviceId}`);

export const updateRoomServiceQuantity = (roomId, serviceId, quantity) => {
  return api.put(`/api/owner/rooms/${roomId}/services/${serviceId}`, {
    quantity: Number(quantity),
  });
};
