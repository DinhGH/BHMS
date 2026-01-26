import { authService } from "../services/authService.js";

//xu ly logout
export const logout = async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await authService.logoutUser(userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Logout failed",
    });
  }
};
