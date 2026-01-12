const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const multer = require('multer');          
const path = require('path');
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const app = express();


app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); 
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh: JPEG, JPG, PNG, GIF'));
  }
});

app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/signup', upload.single('avatar'), async (req, res) => {
  try {
    const { fullName, email, password, phone, gender, hometown } = req.body;

    if (!fullName || !email || !password || !phone || !gender) {
      return res.status(400).json({ 
        error: 'fullName, email, password, phone, and gender are required' 
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 8);

    let avatarPath = null;
    if (req.file) {
      avatarPath = `/uploads/${req.file.filename}`;
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hashed,
        role: 'TENANT',
        status: 'NO_RENTING',
        active: 'YES',
        createdAt: new Date(),
        updatedAt: new Date(),
        phone,
        gender,
        hometown: hometown || null,  // optional
        avatar: avatarPath           // lưu đường dẫn file
      }
    });

    const { passwordHash: _p, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/google-signup', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify token với Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    // Lấy thông tin user từ token
    const payload = ticket.getPayload();
    const { email, name, picture } = payload; // Lấy thêm picture (avatar)
    
    // Tìm hoặc tạo user
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: name,
          role: 'TENANT',
          status: 'NO_RENTING',
          active: 'YES',
          provider: 'GOOGLE',
          avatar: picture || null,        // Avatar từ Google
          phone: '',                     
          gender: '',                    // Google không cung cấp
          hometown: null,                  // Google không cung cấp
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Tạo JWT token
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { passwordHash: _p, ...safeUser } = user;
    res.json({ token: jwtToken, user: safeUser });
    
  } catch (err) {
    console.error('Google signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Facebook Sign Up với avatar từ Facebook
app.post('/api/facebook-signup', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Lấy thông tin từ Facebook, bao gồm avatar, gender
    const facebookResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large),gender&access_token=${token}`
    );
    
    if (!facebookResponse.data.id) {
      return res.status(401).json({ error: 'Invalid Facebook token' });
    }
    
    const fbData = facebookResponse.data;
    const userEmail = fbData.email;
    const userName = fbData.name;
    const userAvatar = fbData.picture?.data?.url || null;  // Avatar từ Facebook
    const userGender = fbData.gender || '';               // Gender nếu có

    if (!userEmail) {
      return res.status(400).json({ error: 'Cannot get email from Facebook account' });
    }

    let user = await prisma.user.findUnique({ 
      where: { email: userEmail } 
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          fullName: userName,
          role: 'TENANT',
          status: 'NO_RENTING',
          active: 'YES',
          provider: 'FACEBOOK',
          avatar: userAvatar,              // Avatar từ Facebook
          gender: userGender,              // Gender nếu Facebook cung cấp
          phone: '',                     // Để null, user tự cập nhật
          hometown: null,                  // Facebook không cung cấp
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Tạo JWT Token
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { passwordHash: _p, ...safeUser } = user;
    res.json({ token: jwtToken, user: safeUser });

  } catch (err) {
    console.error("Facebook Login Error:", err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
