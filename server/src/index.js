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
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;
    
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
    
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
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

    const facebookResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
    );

    if (!facebookResponse.data.id) {
      return res.status(401).json({ error: 'Invalid Facebook token' });
    }
    const fbData = facebookResponse.data;
    const userEmail = fbData.email || email; 
    const userName = fbData.name || name;

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
          provider: 'facebook',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

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
