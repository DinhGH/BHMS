// src/config/passport.js
// Cấu hình Passport strategies

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { PrismaClient } = require('@prisma/client');
const { verifyPassword } = require('../utils/passwordUtils');

const prisma = new PrismaClient();

// ===== Local Strategy (Email + Password) =====
passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          return done(null, false, { message: 'Email không tồn tại' });
        }

        if (!user.passwordHash) {
          return done(null, false, {
            message: 'Tài khoản này sử dụng OAuth. Vui lòng đăng nhập bằng Google hoặc Facebook'
          });
        }

        const isPasswordValid = await verifyPassword(password, user.passwordHash);

        if (!isPasswordValid) {
          return done(null, false, { message: 'Password không chính xác' });
        }

        if (user.active === 'NO') {
          return done(null, false, { message: 'Tài khoản đã bị vô hiệu hoá' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// ===== Google OAuth Strategy =====
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        // Find or create user by email
        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          // Tạo user mới
          user = await prisma.user.create({
            data: {
              email,
              provider: 'google',
              fullName: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
              avatar: profile.photos?.[0]?.value || null,
              role: 'TENANT',
              status: 'NO_RENTING',
              active: 'YES',
              phone: '',
              gender: ''
            }
          });
        } else if (!user.provider) {
          // Update provider nếu user đã tồn tại
          user = await prisma.user.update({
            where: { email },
            data: { provider: 'google' }
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// ===== Facebook OAuth Strategy =====
passport.use(
  'facebook',
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name', 'photos']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `facebook_${profile.id}@bhms.local`;

        // Find or create user by email
        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          // Tạo user mới
          user = await prisma.user.create({
            data: {
              email,
              provider: 'facebook',
              fullName: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
              avatar: profile.photos?.[0]?.value || null,
              role: 'TENANT',
              status: 'NO_RENTING',
              active: 'YES',
              phone: '',
              gender: ''
            }
          });
        } else if (!user.provider) {
          // Update provider nếu user đã tồn tại
          user = await prisma.user.update({
            where: { email },
            data: { provider: 'facebook' }
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;module.exports = passport;
