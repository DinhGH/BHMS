const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 8);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hashed,
        role: 'TENANT',
        status: 'NO_RENTING',
        active: 'YES',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const { passwordHash: _p, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/google-signup', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Step 1: Verify token với Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    // Step 2: Lấy thông tin user từ token
    const payload = ticket.getPayload();
    const { email, name } = payload;
    
    // Step 3: Tìm hoặc tạo user
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: name,
          role: 'TENANT',
          status: 'NO_RENTING',
          active: 'YES',
          provider: 'google',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Step 4: Tạo JWT token
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Step 5: Return JWT token
    const { passwordHash: _p, ...safeUser } = user;
    res.json({ token: jwtToken, user: safeUser });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/facebook-signup', async (req, res) => {
  try {
    const { token, facebookId, email, name } = req.body;

    // Step 1: Verify token bằng cách gọi Graph API của Facebook
    // Để đảm bảo token frontend gửi lên là hàng thật
    const facebookResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
    );

    // Kiểm tra nếu Facebook không trả về ID -> Token đểu
    if (!facebookResponse.data.id) {
      return res.status(401).json({ error: 'Invalid Facebook token' });
    }

    // Step 2: Lấy thông tin chuẩn từ Facebook (Ưu tiên lấy từ response của FB cho an toàn)
    const fbData = facebookResponse.data;
    const userEmail = fbData.email || email; // Một số trường hợp FB k trả email, dùng email frontend gửi backup
    const userName = fbData.name || name;

    if (!userEmail) {
        return res.status(400).json({ error: 'Cannot get email from Facebook account' });
    }

    // Step 3: Tìm xem user đã có trong DB chưa
    let user = await prisma.user.findUnique({ 
      where: { email: userEmail } 
    });

    // Nếu chưa có -> Tạo mới (Register)
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          fullName: userName,
          role: 'TENANT',
          status: 'NO_RENTING',
          active: 'YES',
          provider: 'facebook',
          // Tương tự Google, nếu DB lỗi thiếu pass thì mở comment dòng dưới:
          // passwordHash: await bcrypt.hash(Math.random().toString(), 8), 
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Step 4: Tạo JWT Token của hệ thống mình
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 5: Trả về client
    // Loại bỏ passwordHash (nếu có) trước khi trả về
    const { passwordHash: _p, ...safeUser } = user;
    res.json({ token: jwtToken, user: safeUser });

  } catch (err) {
    console.error("Facebook Login Error:", err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
