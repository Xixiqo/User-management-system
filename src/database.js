const { Pool } = require('pg');
require('dotenv').config();

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Alternatively, you can use individual parameters:
  // host: process.env.DB_HOST,
  // port: process.env.DB_PORT,
  // database: process.env.DB_NAME,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        profile_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on email for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// User operations
const userModel = {
  // Create new user
  async create(name, email, profileImage = null) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO users (name, email, profile_image)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const values = [name, email, profileImage];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all users
  async getAll() {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM users ORDER BY created_at DESC';
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  },

  // Get user by ID
  async getById(id) {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  },

  // Get user by email
  async getByEmail(email) {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await client.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  },

  // Update user
  async update(id, name, email, profileImage) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE users 
        SET name = $2, email = $3, profile_image = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;
      const values = [id, name, email, profileImage];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete user
  async delete(id) {
    const client = await pool.connect();
    try {
      const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
      const result = await client.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = {
  pool,
  initializeDatabase,
  userModel
};
