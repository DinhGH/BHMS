import {
  listNotifications,
  markNotificationAsRead,
} from "../services/notificationsService.js";

export async function getNotifications(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const q = (req.query.q || "").toString();

    const notifications = await listNotifications({ userId, query: q });
    res.json(notifications);
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("/notifications error", err);
    res.status(status).json({ error: err.message || "Internal server error" });
  }
}

export async function markAsRead(req, res) {
  try {
    const notificationId = parseInt(req.params.notificationId, 10);

    const notification = await markNotificationAsRead(notificationId);
    res.json(notification);
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("/notifications/read error", err);
    res.status(status).json({ error: err.message || "Internal server error" });
  }
}
