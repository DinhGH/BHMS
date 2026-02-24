import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authService = {
  async registerUser(email, password, passwordConfirm) {
    // Validation
    if (!email || !password || !passwordConfirm) {
      throw new Error(
        "Email, password, and password confirmation are required",
      );
    }

    if (password !== passwordConfirm) {
      throw new Error("Passwords do not match");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with default OWNER role
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: "OWNER",
      },
    });
    await prisma.owner.create({
      data: {
        userId: newUser.id,
      },
    });
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName || "",
        imageUrl: newUser.imageUrl || "",
      },
      token,
    };
  },

  async loginUser(email, password) {
    // Validation
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        active: true,
        passwordHash: true,
        fullName: true,
        imageUrl: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    if (user.status === "BLOCKED") {
      throw new Error("Account is blocked");
    }

    if (user.active === "NO") {
      throw new Error("Account is inactive");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName || "",
        imageUrl: user.imageUrl || "",
      },
      token,
    };
  },
};
