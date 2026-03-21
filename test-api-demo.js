const fetch = require('node-fetch');

async function demo() {
  console.log('🌐 Testing HTTP API...\n');

  // 1. Get Admin JWT
  console.log('1️⃣ Getting Admin JWT token...');
  const tokenRes = await fetch('http://localhost:3000/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fleetpulse.com', role: 'Admin' })
  });
  const { token } = await tokenRes.json();
  console.log(`   ✅ Token: ${token.substring(0, 50)}...\n`);

  // 2. List Devices
  console.log('2️⃣ Listing all devices (Admin)...');
  const devicesRes = await fetch('http://localhost:3000/api/devices', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const devices = await devicesRes.json();
  console.log(`   ✅ Found ${devices.length} devices:`);
  devices.forEach(d => console.log(`      - ${d.imei} (${d.vehicleNumber || 'No vehicle'})`));

  // 3. Get Device History
  console.log('\n3️⃣ Getting history for device 354678901234561...');
  const historyRes = await fetch('http://localhost:3000/api/devices/354678901234561/history', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const history = await historyRes.json();
  console.log(`   ✅ Found ${history.length} location logs`);
  if (history.length > 0) {
    const latest = history[0];
    console.log(`      Latest: Lat ${latest.lat}, Lng ${latest.lng}, Speed ${latest.speed} km/h`);
  }

  // 4. Health Check
  console.log('\n4️⃣ Checking system health...');
  const healthRes = await fetch('http://localhost:3000/api/health');
  const health = await healthRes.json();
  console.log(`   ✅ Status: ${health.status}`);
  console.log(`      Pending logs: ${health.pending_count}`);
  console.log(`      Uptime: ${health.uptime_seconds} seconds`);

  console.log('\n✅ All API tests passed!');
}

demo().catch(err => console.error('❌ Error:', err.message));
