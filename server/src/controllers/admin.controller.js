import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import pkg from "@prisma/client";
import jwt from "jsonwebtoken";

const { Role, User_status, User_active } = pkg;
/**
 * GET /api/users
 * Lấy danh sách user
 */
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * GET /api/user/me
 * Lấy thông tin user hiện tại dựa vào token
 */
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header không hợp lệ" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        active: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("getCurrentUser error:", err.message);
    return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};

/**
 * PATCH /api/users/:id
 * Block / Unblock user
 */
export const updateUserStatus = async (req, res) => {
  const userId = Number(req.params.id);
  const { status } = req.body;

  if (!["ACTIVE"].includes(status)) {
    return res.status(400).json({
      message: "Status không hợp lệ",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    return res.status(200).json({
      message: "Cập nhật trạng thái thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateUserStatus error:", error);
    return res.status(500).json({
      message: "Không thể cập nhật trạng thái user",
    });
  }
};

/**
 * DELETE /api/users
 */
export const deleteUsers = async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: "No users selected" });
  }

  try {
    await prisma.user.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return res.json({ message: "Delete users success" });
  } catch (err) {
    return res.status(500).json({ message: "Delete failed" });
  }
};

/**
 * POST /api/users/add
 */
export const addUser = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      provider,
      role = "TENANT",
      status = "RENTING",
      active = "YES",
    } = req.body;

    // ===== VALIDATE EMAIL =====
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const blockedDomains = [
      "mailinator.com",
      "10minutemail.com",
      "tempmail.com",
      "guerrillamail.com",
    ];

    const domain = email.split("@")[1];
    if (blockedDomains.includes(domain)) {
      return res.status(400).json({
        message: "Temporary email is not allowed",
      });
    }

    // ===== VALIDATE PASSWORD =====
    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\S]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include uppercase, lowercase, number, special character and no spaces",
      });
    }

    // ===== CHECK EXIST =====
    const existedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existedUser) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    // ===== CREATE USER =====
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        provider,
        role: Role[role],
        status: User_status[status],
        active: User_active[active],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        active: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Create user success",
      user: newUser,
    });
  } catch (err) {
    console.error("addUser error:", err);
    return res.status(500).json({
      message: "Create user failed",
    });
  }
};
