import { listNotifications } from "../services/notificationsService.js";

export async function getNotifications(req, res) {
  try {
    const userId = parseInt(req.query.userId, 10);
    const q = (req.query.q || "").toString();

    const notifications = await listNotifications({ userId, query: q });
    res.json(notifications);
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("/notifications error", err);
    res.status(status).json({ error: err.message || "Internal server error" });
  }
}
