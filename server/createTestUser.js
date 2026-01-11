// Create test user with known password
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    const conn = await pool.getConnection();
    
    const testEmail = 'logout-test@example.com';
    const testPassword = 'test123456';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    // Check if user exists
    const [existingUsers] = await conn.query(
      'SELECT id FROM `User` WHERE email = ?',
      [testEmail]
    );
    
    if (existingUsers.length > 0) {
      console.log('✅ Test user already exists');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
    } else {
      // Create new user
      await conn.query(
        'INSERT INTO `User` (email, passwordHash, fullName, role, status, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3))',
        [testEmail, hashedPassword, 'Logout Test User', 'TENANT', 'RENTING', 'YES']
      );
      console.log('✅ Test user created');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
    }
    
    conn.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
