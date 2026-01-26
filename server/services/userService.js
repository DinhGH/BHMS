import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

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

export const userService = {
  async sendOTP(email) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Check if email exists in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Email not found in system");
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
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
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

    return { success: true, message: "OTP sent to your email" };
  },

  async verifyOTP(email, otp) {
    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    // Query user with matching email and OTP
    const user = await prisma.user.findFirst({
      where: {
        email,
        otp,
      },
    });

    if (!user) {
      throw new Error("Invalid OTP");
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpire) {
      throw new Error("OTP has expired");
    }

    return { success: true, message: "OTP verified successfully" };
  },

  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      throw new Error("Email, OTP, and new password are required");
    }

    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Verify OTP and email
    const user = await prisma.user.findFirst({
      where: {
        email,
        otp,
      },
    });

    if (!user) {
      throw new Error("Invalid OTP or email");
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpire) {
      throw new Error("OTP has expired");
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

    return { success: true, message: "Password reset successfully" };
  },
};
