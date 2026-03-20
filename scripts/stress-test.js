#!/usr/bin/env node

/**
 * Stress Test Script for Fleet Pulse TCP Server
 * 
 * Simulates 50 concurrent TCP connections sending 1 ping/second for 2 minutes
 * Mix of registered/unregistered IMEIs and malformed packets
 */

const net = require('net');

const CONFIG = {
  host: process.env.TCP_HOST || 'localhost',
  port: parseInt(process.env.TCP_PORT || '5000', 10),
  connections: 50,
  duration: 120, // seconds
  pingInterval: 1000, // ms
};

const REGISTERED_IMEIS = [
  '354678901234561',
  '354678901234562',
  '354678901234563',
  '354678901234564',
  '354678901234565',
];

const UNREGISTERED_IMEIS = [
  '000000000000000',
  '111111111111111',
  '999999999999999',
];

let stats = {
  sent: 0,
  errors: 0,
  malformed: 0,
};

function randomCoordinate(base, variance) {
  return (base + (Math.random() - 0.5) * variance).toFixed(4);
}

function generatePacket() {
  const rand = Math.random();
  
  // 10% malformed packets
  if (rand < 0.1) {
    stats.malformed++;
    return 'PING,354678901234561,INVALID\n';
  }
  
  // 15% unregistered IMEIs
  const imei = rand < 0.25
    ? UNREGISTERED_IMEIS[Math.floor(Math.random() * UNREGISTERED_IMEIS.length)]
    : REGISTERED_IMEIS[Math.floor(Math.random() * REGISTERED_IMEIS.length)];
  
  const lat = randomCoordinate(18.5204, 0.1);
  const lng = randomCoordinate(73.8567, 0.1);
  const speed = (Math.random() * 100).toFixed(1);
  const ignition = Math.random() > 0.2 ? 1 : 0;
  
  return `PING,${imei},${lat},${lng},${speed},${ignition}\n`;
}

function createConnection(id) {
  const client = new net.Socket();
  let interval;
  
  client.connect(CONFIG.port, CONFIG.host, () => {
    console.log(`[Connection ${id}] Connected`);
    
    interval = setInterval(() => {
      try {
        const packet = generatePacket();
        client.write(packet);
        stats.sent++;
      } catch (err) {
        stats.errors++;
        console.error(`[Connection ${id}] Error:`, err.message);
      }
    }, CONFIG.pingInterval);
  });
  
  client.on('error', (err) => {
    stats.errors++;
    console.error(`[Connection ${id}] Socket error:`, err.message);
  });
  
  client.on('close', () => {
    clearInterval(interval);
    console.log(`[Connection ${id}] Closed`);
  });
  
  return client;
}

async function main() {
  console.log('Fleet Pulse Stress Test');
  console.log('=======================');
  console.log(`Target: ${CONFIG.host}:${CONFIG.port}`);
  console.log(`Connections: ${CONFIG.connections}`);
  console.log(`Duration: ${CONFIG.duration}s`);
  console.log(`Rate: 1 ping/second per connection`);
  console.log('');
  
  const connections = [];
  
  // Create connections
  for (let i = 0; i < CONFIG.connections; i++) {
    connections.push(createConnection(i + 1));
    await new Promise(resolve => setTimeout(resolve, 50)); // Stagger connections
  }
  
  // Progress reporting
  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const rate = (stats.sent / elapsed).toFixed(1);
    console.log(`[${elapsed}s] Sent: ${stats.sent} | Rate: ${rate}/s | Errors: ${stats.errors} | Malformed: ${stats.malformed}`);
  }, 5000);
  
  // Run for duration
  await new Promise(resolve => setTimeout(resolve, CONFIG.duration * 1000));
  
  // Cleanup
  clearInterval(progressInterval);
  connections.forEach(conn => conn.destroy());
  
  console.log('');
  console.log('Test Complete');
  console.log('=============');
  console.log(`Total Packets Sent: ${stats.sent}`);
  console.log(`Malformed Packets: ${stats.malformed}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Average Rate: ${(stats.sent / CONFIG.duration).toFixed(1)} packets/second`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
