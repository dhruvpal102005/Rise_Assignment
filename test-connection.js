require('dotenv/config');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

async function test() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
    const client = await pool.connect();
    console.log('✓ Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('✓ Query executed:', result.rows[0]);
    
    const devices = await client.query('SELECT COUNT(*) FROM devices');
    console.log('✓ Devices in database:', devices.rows[0].count);
    
    client.release();
    await pool.end();
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Connection failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

test();
