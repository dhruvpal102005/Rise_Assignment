const net = require('net');

const client = new net.Socket();

client.connect(5000, 'localhost', () => {
  console.log('✅ Connected to TCP server');
  
  // Send valid registered device ping
  client.write('PING,354678901234561,18.5204,73.8567,42.5,1\n');
  console.log('📤 Sent: PING,354678901234561,18.5204,73.8567,42.5,1');
  
  setTimeout(() => {
    // Send unregistered device ping
    client.write('PING,000000000000000,18.5204,73.8567,10.0,0\n');
    console.log('📤 Sent: PING,000000000000000,18.5204,73.8567,10.0,0');
  }, 1000);
  
  setTimeout(() => {
    // Send malformed packet
    client.write('INVALID,DATA,HERE\n');
    console.log('📤 Sent: INVALID,DATA,HERE (malformed)');
  }, 2000);
  
  setTimeout(() => {
    client.destroy();
    console.log('✅ Test complete');
    process.exit(0);
  }, 3000);
});

client.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
