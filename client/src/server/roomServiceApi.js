import api from "../server/api";

export const getRoomServicesApi = (roomId) =>
  api.get(`/owner/rooms/${roomId}/services`);

export const addServiceToRoomApi = (roomId, data) =>
  api.post(`/owner/rooms/${roomId}/services`, data);

export const removeServiceFromRoomApi = (roomId, serviceId) =>
  api.delete(`/owner/rooms/${roomId}/services/${serviceId}`);
