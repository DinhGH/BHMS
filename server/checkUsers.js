const pool = require('./config/database');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, email, fullName, role FROM `User`');
    console.log('Users in database:');
    console.table(users);
    connection.release();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit();
}

checkUsers();
