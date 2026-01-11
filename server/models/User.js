const pool = require('../config/database');

class User {
  static async findByEmail(email) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM `User` WHERE email = ?',
        [email]
      );
      connection.release();
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM `User` WHERE id = ?',
        [id]
      );
      connection.release();
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async create(userData) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO `User` (email, passwordHash, fullName, role, status, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3))',
        [userData.email, userData.password, userData.name, userData.role || 'TENANT', 'RENTING', 'YES']
      );
      connection.release();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userData) {
    try {
      const connection = await pool.getConnection();
      const fields = [];
      const values = [];

      // Map field names to database columns
      const fieldMap = {
        name: 'fullName',
        password: 'passwordHash',
        role: 'role',
        status: 'status',
        active: 'active'
      };

      for (const [key, value] of Object.entries(userData)) {
        if (value !== undefined) {
          const dbColumn = fieldMap[key] || key;
          fields.push(`\`${dbColumn}\` = ?`);
          values.push(value);
        }
      }

      values.push(id);

      const [result] = await connection.query(
        `UPDATE \`User\` SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      connection.release();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'DELETE FROM `User` WHERE id = ?',
        [id]
      );
      connection.release();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM `User`');
      connection.release();
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
