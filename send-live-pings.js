const net = require('net');

const registeredIMEIs = [
  '354678901234561',
  '354678901234562',
  '354678901234563',
  '354678901234564',
  '354678901234565'
];

function randomLat() {
  return (Math.random() * 180 - 90).toFixed(4);
}

function randomLng() {
  return (Math.random() * 360 - 180).toFixed(4);
}

function randomSpeed() {
  return (Math.random() * 120).toFixed(1);
}

function randomIgnition() {
  return Math.random() > 0.5 ? '1' : '0';
}

console.log('🚗 Sending live GPS pings...\n');

const client = new net.Socket();

client.connect(5000, 'localhost', () => {
  console.log('✅ Connected to TCP server\n');
  
  let count = 0;
  const interval = setInterval(() => {
    const imei = registeredIMEIs[count % registeredIMEIs.length];
    const ping = `PING,${imei},${randomLat()},${randomLng()},${randomSpeed()},${randomIgnition()}\n`;
    
    client.write(ping);
    console.log(`📤 [${count + 1}] Sent ping from ${imei}`);
    
    count++;
    
    if (count >= 20) {
      clearInterval(interval);
      setTimeout(() => {
        client.destroy();
        console.log('\n✅ Sent 20 pings. Check your dashboard at http://localhost:3000');
        process.exit(0);
      }, 1000);
    }
  }, 1000); // Send 1 ping per second
});

client.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
