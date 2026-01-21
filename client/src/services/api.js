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
    },
  );

  if (!res.ok) throw new Error("Failed to mark notification as read");
  return await res.json();
}

//////////////////////////////////////////////////
// SERVICES
//////////////////////////////////////////////////

export async function getServices(houseId) {
  if (!houseId) throw new Error("houseId is required");

  const res = await fetch(`${BASE_URL}/api/services/house/${houseId}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch services");
  return await res.json();
}

export async function createService(serviceData) {
  const res = await fetch(`${BASE_URL}/api/services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(serviceData),
  });

  if (!res.ok) throw new Error("Failed to create service");
  return await res.json();
}

export async function updateService(serviceId, serviceData) {
  const res = await fetch(`${BASE_URL}/api/services/${serviceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(serviceData),
  });

  if (!res.ok) throw new Error("Failed to update service");
  return await res.json();
}

export async function deleteService(serviceId) {
  const res = await fetch(`${BASE_URL}/api/services/${serviceId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to delete service");
  return await res.json();
}
