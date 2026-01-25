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
