import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Configure Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Generate random OTP (6 digits)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ===== API ENDPOINTS =====

// POST /api/user/forgot-password - Send OTP to email
app.post("/api/user/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email exists in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Email not found in system" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Calculate OTP expiration (5 minutes)
    const otpExpire = new Date();
    otpExpire.setMinutes(otpExpire.getMinutes() + 5);

    // Update user with OTP and expiration time
    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpire,
      },
    });

    // Send email
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Your OTP Code - Password Reset",
        html: `
          <h2>Password Reset Request</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #2f6be8; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p><strong>This code will expire in 5 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      res.json({ success: true, message: "OTP sent to your email" });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      res.status(500).json({ error: "Failed to send OTP email. Please try again." });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/verify-otp - Verify OTP
app.post("/api/user/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Query user with matching email and OTP
    const user = await prisma.user.findFirst({
      where: {
        email,
        otp,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpire) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/reset-password - Reset password
app.post("/api/user/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Verify OTP and email
    const user = await prisma.user.findFirst({
      where: {
        email,
        otp,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid OTP or email" });
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpire) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        otp: null,
        otpExpire: null,
      },
    });

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
