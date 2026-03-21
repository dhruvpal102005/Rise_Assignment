require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkLogs() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM location_logs');
    console.log(`✅ Total location logs in database: ${result.rows[0].count}`);
    
    const recent = await pool.query('SELECT * FROM location_logs ORDER BY timestamp DESC LIMIT 5');
    console.log('\n📍 Latest 5 location logs:');
    recent.rows.forEach((log, i) => {
      console.log(`   ${i + 1}. IMEI: ${log.imei}, Lat: ${log.lat}, Lng: ${log.lng}, Speed: ${log.speed}, Time: ${log.timestamp}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLogs();
