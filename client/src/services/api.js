const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const defaultHeaders = { "Content-Type": "application/json" };

const withAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchApi(path, { method = "GET", body } = {}) {
  const headers = { ...defaultHeaders, ...withAuthHeaders() };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || "Request failed";
    throw new Error(message);
  }
  return data;
}

// Tenants API
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
    body: JSON.stringify(data),
    credentials: "include",
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
    body: JSON.stringify(data),
    credentials: "include",
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

// Payments API
export async function getPayments() {
  const res = await fetch(`${BASE_URL}/api/payments`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch payments");
  return await res.json();
}

// Notifications API
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
