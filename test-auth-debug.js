const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://localhost:3000/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fleetpulse.com', password: 'password123' })
  });
  
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

test();
