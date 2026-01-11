const pool = require('./config/database');
require('dotenv').config();

async function checkSchema() {
  try {
    const connection = await pool.getConnection();
    const [schema] = await connection.query('DESCRIBE `User`');
    console.log('User table schema:');
    console.table(schema);
    connection.release();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit();
}

checkSchema();
