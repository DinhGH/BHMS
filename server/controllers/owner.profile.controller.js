import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

/* ================= GET OWNER PROFILE ================= */
export const getOwnerProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        imageUrl: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            qrImageUrl: true,
            houses: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalHouses = user.owner?.houses?.length || 0;

    const profileData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName || "",
      imageUrl: user.imageUrl || "",
      qrImageUrl: user.owner?.qrImageUrl || null,
      ownerId: user.owner?.id || null,
      createdAt: user.createdAt,
      totalHouses: totalHouses,
    };

    res.json(profileData);
  } catch (err) {
    console.error("getOwnerProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE OWNER PROFILE ================= */
export const updateOwnerProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, imageUrl, email, qrImageUrl } = req.body;

    if (!fullName || typeof fullName !== "string") {
      return res.status(400).json({ message: "Full name is required" });
    }

    if (email !== undefined && typeof email !== "string") {
      return res.status(400).json({ message: "Email must be a string" });
    }

    const nextEmail = email?.trim().toLowerCase();

    if (nextEmail) {
      const existed = await prisma.user.findFirst({
        where: {
          email: nextEmail,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (existed) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          fullName: fullName.trim(),
          imageUrl: imageUrl || null,
          ...(nextEmail ? { email: nextEmail } : {}),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          imageUrl: true,
          createdAt: true,
        },
      });

      const owner = await tx.owner.update({
        where: { userId },
        data: {
          qrImageUrl: qrImageUrl || null,
        },
        select: {
          id: true,
          qrImageUrl: true,
          houses: {
            select: { id: true },
          },
        },
      });

      return {
        ...user,
        ownerId: owner.id,
        qrImageUrl: owner.qrImageUrl,
        totalHouses: owner.houses?.length || 0,
      };
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("updateOwnerProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash || "",
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from current" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("changePassword:", err);
    res.status(500).json({ message: "Server error" });
  }
};
