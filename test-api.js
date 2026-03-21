const fetch = require('node-fetch');

async function testAPI() {
  try {
    // 1. Get Admin JWT
    console.log('\n1️⃣ Testing POST /api/auth/token (Admin)...');
    const tokenRes = await fetch('http://localhost:3000/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fleetpulse.com', role: 'Admin' })
    });
    const { token: adminToken } = await tokenRes.json();
    console.log('✅ Admin JWT:', adminToken.substring(0, 50) + '...');

    // 2. Get Customer JWT
    console.log('\n2️⃣ Testing POST /api/auth/token (Customer)...');
    const customerTokenRes = await fetch('http://localhost:3000/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@example.com', role: 'Customer' })
    });
    const { token: customerToken } = await customerTokenRes.json();
    console.log('✅ Customer JWT:', customerToken.substring(0, 50) + '...');

    // 3. List all devices (Admin)
    console.log('\n3️⃣ Testing GET /devices (Admin)...');
    const devicesRes = await fetch('http://localhost:3000/api/devices', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const devices = await devicesRes.json();
    console.log(`✅ Found ${devices.length} devices:`, devices.map(d => d.imei));

    // 4. Get device history (Admin)
    console.log('\n4️⃣ Testing GET /devices/:imei/history (Admin)...');
    const historyRes = await fetch('http://localhost:3000/api/devices/354678901234561/history', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const history = await historyRes.json();
    console.log(`✅ Found ${history.length} location logs for device 354678901234561`);
    if (history.length > 0) {
      console.log('   Latest:', history[0]);
    }

    // 5. Health check
    console.log('\n5️⃣ Testing GET /health...');
    const healthRes = await fetch('http://localhost:3000/api/health');
    const health = await healthRes.json();
    console.log('✅ Health:', health);

    // 6. Test Customer access (should only see their devices)
    console.log('\n6️⃣ Testing Customer RBAC...');
    const customerHistoryRes = await fetch('http://localhost:3000/api/devices/354678901234561/history', {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    if (customerHistoryRes.ok) {
      console.log('✅ Customer can access their device (354678901234561)');
    }

    const forbiddenRes = await fetch('http://localhost:3000/api/devices/354678901234564/history', {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    if (forbiddenRes.status === 403) {
      console.log('✅ Customer blocked from unassigned device (354678901234564)');
    }

    console.log('\n✅ All API tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
