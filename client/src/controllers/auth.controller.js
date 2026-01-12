const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { sendOTP } = require("../services/mail.service");

const prisma = new PrismaClient();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Gửi OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    const otp = generateOTP();
    const expire = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpire: expire,
      },
    });

   // await sendOTP(email, otp);

    res.json({ message: "Đã gửi OTP về email" });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// 2. Xác thực OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
        otp,
        otpExpire: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "OTP không hợp lệ hoặc hết hạn" });
    }

    res.json({ message: "OTP hợp lệ" });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// 3. Reset mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hash,
        otp: null,
        otpExpire: null,
      },
    });

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

