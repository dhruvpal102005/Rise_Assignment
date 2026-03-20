require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const result = await pool.query('SELECT email, role FROM users');
    console.log('✅ Database connection successful!');
    console.log('Users:', result.rows);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
