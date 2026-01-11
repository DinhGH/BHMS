import {
  fetchTenantProfile,
  fetchTenantRoom,
} from "../services/tenantService.js";

// Get tenant profile with basic user info
export async function getTenantProfile(req, res) {
  try {
    const { userId } = req.params;
    const user = await fetchTenantProfile(userId);
    res.json(user);
  } catch (err) {
    console.error("getTenantProfile error:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Internal server error" });
  }
}

// Get tenant's current room info
export async function getTenantRoom(req, res) {
  try {
    const { userId } = req.params;
    const room = await fetchTenantRoom(userId);
    res.json(room || { error: "No room assigned" });
  } catch (err) {
    console.error("getTenantRoom error:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Internal server error" });
  }
}
