import api from "./api";

export const previewInvoice = (roomId) =>
  api.get(`/api/owner/rooms/${roomId}/invoice-preview`);

export const sendInvoice = (roomId) =>
  api.post(`/api/owner/rooms/${roomId}/invoice`);

export const createInvoiceWithQr = (roomId, file) => {
  const fd = new FormData();
  if (file) fd.append("qr", file);
  // Let the fetch helper detect and set headers for FormData
  return api.post(`/api/owner/rooms/${roomId}/invoice/create`, fd);
};

// Public endpoints (no auth required)
export const getInvoiceDetails = (invoiceId) =>
  api.get(`/api/tenants/invoices/${invoiceId}`);

export const confirmPayment = (invoiceId, method, proofFile) => {
  if (proofFile) {
    // QR Transfer with proof image
    const fd = new FormData();
    fd.append("method", method);
    fd.append("proof", proofFile);
    // No manual Content-Type header: browser will set boundary
    return api.post(`/api/tenants/invoices/${invoiceId}/confirm-payment`, fd);
  } else {
    // Cash or other methods without file
    return api.post(`/api/tenants/invoices/${invoiceId}/confirm-payment`, {
      method,
    });
  }
};
