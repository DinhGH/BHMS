const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getNotifications(userId, q = "") {
  if (!userId) throw new Error("userId is required");

  const params = new URLSearchParams();
  if (q) params.set("q", q);

  const url = `${BASE_URL}/api/notifications/${userId}${
    q ? `?${params.toString()}` : ""
  }`;

  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch notifications");
  return await res.json();
}

export async function markNotificationAsRead(notificationId) {
  const res = await fetch(
    `${BASE_URL}/api/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      credentials: "include",
    }
  );

  if (!res.ok) throw new Error("Failed to mark notification as read");
  return await res.json();
}

export async function getReports({ page = 1, limit = 10, status, search, target, orderBy, order }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (target) params.set("target", target);
  if (orderBy) params.set("orderBy", orderBy);
  if (order) params.set("order", order);

  const url = `${BASE_URL}/api/reports?${params.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return await res.json();
}

export async function updateReportStatus(reportId, status) {
  const res = await fetch(`${BASE_URL}/api/reports/${reportId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error("Failed to update report status");
  return await res.json();
}

export async function createReport(payload) {
  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create report");
  return await res.json();
}

export async function updateReport(reportId, payload) {
  const res = await fetch(`${BASE_URL}/api/reports/${reportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update report");
  return await res.json();
}

export async function deleteReport(reportId) {
  const res = await fetch(`${BASE_URL}/api/reports/${reportId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to delete report");
  return await res.json();
}

export async function createReportAdmin(payload) {
  const res = await fetch(`${BASE_URL}/api/report-admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create report");
  return await res.json();
}

export async function getReportAdmins({
  page = 1,
  limit = 10,
  status,
  search,
  target,
  orderBy,
  order,
  senderId,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (target) params.set("target", target);
  if (orderBy) params.set("orderBy", orderBy);
  if (order) params.set("order", order);
  if (senderId) params.set("senderId", String(senderId));

  const url = `${BASE_URL}/api/report-admins?${params.toString()}`;
  const res = await fetch(url, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch admin reports");
  return await res.json();
}

export async function updateReportAdmin(reportId, payload) {
  const res = await fetch(`${BASE_URL}/api/report-admins/${reportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update report");
  return await res.json();
}

export async function deleteReportAdmin(reportId, payload) {
  const res = await fetch(`${BASE_URL}/api/report-admins/${reportId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) throw new Error("Failed to delete report");
  if (res.status === 204) return null;
  return await res.json();
}

export async function getPayments() {
  const res = await fetch(`${BASE_URL}/api/payments`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch payments");
  return await res.json();
}
// Tenant Management APIs
export async function getTenants() {
  const res = await fetch(`${BASE_URL}/api/tenants`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch tenants");
  return await res.json();
}

export async function getTenant(id) {
  const res = await fetch(`${BASE_URL}/api/tenants/${id}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch tenant");
  return await res.json();
}

export async function createTenant(data) {
  const res = await fetch(`${BASE_URL}/api/tenants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create tenant");
  }
  return await res.json();
}

export async function updateTenant(id, data) {
  const res = await fetch(`${BASE_URL}/api/tenants/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update tenant");
  }
  return await res.json();
}

export async function deleteTenant(id) {
  const res = await fetch(`${BASE_URL}/api/tenants/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete tenant");
  }
  return await res.json();
}

