const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Cho phép đọc dữ liệu JSON gửi lên

// --- API ĐĂNG KÝ (SIGN UP) ---
app.post('/api/signup', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // 1. Kiểm tra xem email đã tồn tại chưa
        const existingUser = await prisma.User.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists!" });
        }

        // 2. Mã hóa mật khẩu (Bắt buộc bảo mật)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Lưu vào Database
        const newUser = await prisma.User.create({
            data: {
                fullName,
                email,
                passwordHash: hashedPassword,
            },
        });

        // 4. Trả về kết quả thành công
        res.status(201).json({ message: "User created successfully!", User: newUser });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Chạy server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});