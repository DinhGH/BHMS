import api from "../server/api";

export const getRoomServicesApi = (roomId) =>
  api.get(`/api/owner/rooms/${roomId}/services`);

export const addServiceToRoomApi = (roomId, data) =>
  api.post(`/api/owner/rooms/${roomId}/services`, data);

export const removeServiceFromRoomApi = (roomId, serviceId) =>
  api.delete(`/api/owner/rooms/${roomId}/services/${serviceId}`);
