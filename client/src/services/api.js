const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getNotifications(userId, q = "") {
  const params = new URLSearchParams();
  if (userId) params.set("userId", String(userId));
  if (q) params.set("q", q);
  const res = await fetch(
    `${BASE_URL}/api/notifications?${params.toString()}`,
    {
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch notifications");
  const data = await res.json();
  return data;
}
