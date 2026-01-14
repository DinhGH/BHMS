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
      clientID: '1022839150374-tqm24fj0n6crq711raq4ji8fcinmh8r6.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'http://localhost:4000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('✅ Nhận được profile từ Google:', profile.id);
        console.log('📧 Email:', profile.emails?.[0]?.value);
        
        const email = profile.emails?.[0]?.value;

        if (!email) {
          console.error('❌ Không lấy được email từ Google profile');
          return done(new Error('Không lấy được email từ Google'), null);
        }

        // Find or create user by email
        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          console.log('🆕 Tạo user mới với email:', email);
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
              gender: '',
              updatedAt: new Date()
            }
          });
          console.log('✅ Tạo user thành công, ID:', user.id);
        } else {
          console.log('👤 User đã tồn tại, ID:', user.id);
          if (!user.provider) {
            console.log('🔄 Update provider cho user:', email);
            // Update provider nếu user đã tồn tại
            user = await prisma.user.update({
              where: { email },
              data: { provider: 'google' }
            });
          }
        }

        console.log('✅ Login Google thành công cho user:', user.email);
        return done(null, user);
      } catch (error) {
        console.error('❌ Lỗi trong Google Strategy:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
        return done(error, null);
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

module.exports = passport;