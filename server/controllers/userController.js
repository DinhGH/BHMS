import { userService } from "../services/userService.js";

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await userService.sendOTP(email);
    res.json(result);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(400).json({ error: error.message || "Failed to send OTP" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await userService.verifyOTP(email, otp);
    res.json(result);
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(400).json({ error: error.message || "OTP verification failed" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await userService.resetPassword(email, otp, newPassword);
    res.json(result);
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(400)
      .json({ error: error.message || "Failed to reset password" });
  }
};
