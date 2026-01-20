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

export async function getPayments() {
  const res = await fetch(`${BASE_URL}/api/payments`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch payments");
  return await res.json();
}
