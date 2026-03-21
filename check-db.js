require('dotenv').config();
const { Pool } = require('pg');

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log('📊 Checking database...\n');
  
  const devices = await pool.query('SELECT imei, vehicle_number FROM devices');
  console.log('Registered IMEIs:');
  devices.rows.forEach(d => console.log(`  - ${d.imei} (${d.vehicle_number || 'No vehicle'})`));
  
  const logs = await pool.query('SELECT COUNT(*) as count FROM location_logs');
  console.log(`\nTotal location logs: ${logs.rows[0].count}`);
  
  await pool.end();
}

check();
