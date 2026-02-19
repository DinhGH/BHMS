import { userService } from "../services/userService.js";
import { prisma } from "../lib/prisma.js";

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

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        imageUrl: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Failed to get profile" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { fullName, imageUrl } = req.body;

    if (fullName !== undefined && typeof fullName !== "string") {
      return res.status(400).json({ message: "Full name must be a string" });
    }

    if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== "string") {
      return res.status(400).json({ message: "Image URL must be a string" });
    }

    if (fullName === undefined && imageUrl === undefined) {
      return res.status(400).json({ message: "No profile fields provided" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        imageUrl: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};
