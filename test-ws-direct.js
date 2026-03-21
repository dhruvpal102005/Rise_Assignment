const WebSocket = require('ws');
const fetch = require('node-fetch');

async function test() {
  // Get token
  console.log('1. Getting token...');
  const tokenRes = await fetch('http://localhost:3000/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fleetpulse.com', role: 'admin' })
  });
  const { token } = await tokenRes.json();
  console.log('✅ Token received\n');

  // Connect WebSocket
  console.log('2. Connecting to WebSocket...');
  const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

  ws.on('open', () => {
    console.log('✅ WebSocket connected\n');
    console.log('3. Waiting for messages...');
    console.log('   Run: node send-live-pings.js in another terminal\n');
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('📨 Received:', msg);
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket closed');
    process.exit(0);
  });

  // Keep alive
  setTimeout(() => {
    console.log('\n⏱️  Test timeout - closing');
    ws.close();
  }, 60000);
}

test();
