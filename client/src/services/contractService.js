import api from "../server/api.js";

export const getContracts = async (params = {}) => {
  return api.get("/api/owner/contracts", { params });
};

export const getContractDetail = async (contractId) => {
  return api.get(`/api/owner/contracts/${contractId}`);
};

export const getContractInvoices = async (contractId) => {
  return api.get(`/api/owner/contracts/${contractId}/invoices`);
};

export const getContractStayHistory = async (contractId) => {
  return api.get(`/api/owner/contracts/${contractId}/stay-history`);
};

export const getContractOptions = async () => {
  return api.get("/api/owner/contracts/options");
};

export const createContract = async (payload) => {
  return api.post("/api/owner/contracts", payload);
};

export const updateContract = async (contractId, payload) => {
  return api.put(`/api/owner/contracts/${contractId}`, payload);
};

export const deleteContract = async (contractId) => {
  return api.delete(`/api/owner/contracts/${contractId}`);
};