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

export async function getTenantRoom(userId) {
  const res = await fetch(`${BASE_URL}/api/tenant/${userId}/room`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch tenant room");
  return await res.json();
}

export async function claimRoom(userId, roomCode) {
  const res = await fetch(`${BASE_URL}/api/tenant/${userId}/claim-room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ roomCode }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to claim room");
  }
  return await res.json();
}
