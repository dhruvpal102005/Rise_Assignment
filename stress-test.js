const net = require('net');

const NUM_CONNECTIONS = 50;
const PINGS_PER_SECOND = 1;
const DURATION_SECONDS = 60;

// Registered IMEIs
const registeredIMEIs = [
  '354678901234561',
  '354678901234562',
  '354678901234563',
  '354678901234564',
  '354678901234565'
];

// Unregistered IMEI
const unregisteredIMEI = '000000000000000';

let totalSent = 0;
let totalErrors = 0;

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

function createPing(imei) {
  // 10% chance of malformed packet
  if (Math.random() < 0.1) {
    return 'INVALID,MALFORMED,PACKET\n';
  }
  
  // 5% chance of unregistered IMEI
  if (Math.random() < 0.05) {
    imei = unregisteredIMEI;
  }
  
  return `PING,${imei},${randomLat()},${randomLng()},${randomSpeed()},${randomIgnition()}\n`;
}

function startClient(id) {
  const client = new net.Socket();
  const imei = registeredIMEIs[id % registeredIMEIs.length];
  
  client.connect(5000, 'localhost', () => {
    console.log(`[Client ${id}] Connected`);
    
    const interval = setInterval(() => {
      try {
        const ping = createPing(imei);
        client.write(ping);
        totalSent++;
      } catch (err) {
        totalErrors++;
      }
    }, 1000 / PINGS_PER_SECOND);
    
    setTimeout(() => {
      clearInterval(interval);
      client.destroy();
    }, DURATION_SECONDS * 1000);
  });
  
  client.on('error', (err) => {
    totalErrors++;
  });
}

console.log(`🚀 Starting stress test:`);
console.log(`   - ${NUM_CONNECTIONS} concurrent connections`);
console.log(`   - ${PINGS_PER_SECOND} ping/second per connection`);
console.log(`   - ${DURATION_SECONDS} seconds duration`);
console.log(`   - Expected total: ${NUM_CONNECTIONS * PINGS_PER_SECOND * DURATION_SECONDS} pings\n`);

// Start all clients
for (let i = 0; i < NUM_CONNECTIONS; i++) {
  setTimeout(() => startClient(i), i * 100); // Stagger connections
}

// Progress reporting
const progressInterval = setInterval(() => {
  console.log(`📊 Progress: ${totalSent} pings sent, ${totalErrors} errors`);
}, 5000);

// Final report
setTimeout(() => {
  clearInterval(progressInterval);
  console.log(`\n✅ Stress test complete!`);
  console.log(`   Total sent: ${totalSent}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Success rate: ${((totalSent / (totalSent + totalErrors)) * 100).toFixed(2)}%`);
  process.exit(0);
}, (DURATION_SECONDS + 5) * 1000);
