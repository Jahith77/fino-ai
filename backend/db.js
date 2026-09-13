const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      note TEXT,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  console.log('Tables created! ✅')
}

createTables()

module.exports = pool