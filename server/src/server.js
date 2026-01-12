// src/server.js
// Main server file - Express application entry point

require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// ===== CORS Configuration =====
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ===== Middleware =====
// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());
// app.use(passport.session()); // Không cần session vì dùng JWT tokens

// ===== Routes =====
// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// ===== Error handling =====
// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`🔒 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📦 Database: ${process.env.DATABASE_URL?.split('/').pop() || 'Unknown'}`);
});

module.exports = app;
