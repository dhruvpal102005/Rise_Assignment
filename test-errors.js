const net = require('net');

console.log('🧪 Testing Error Handling...\n');

// Test 1: Unregistered Device
console.log('1️⃣ Sending UNREGISTERED device ping...');
const client1 = new net.Socket();
client1.connect(5000, 'localhost', () => {
  client1.write('PING,000000000000000,18.5204,73.8567,10.0,0\n');
  console.log('   📤 Sent: PING,000000000000000,... (unregistered IMEI)');
  client1.destroy();
  
  setTimeout(() => {
    // Test 2: Malformed Packet
    console.log('\n2️⃣ Sending MALFORMED packet...');
    const client2 = new net.Socket();
    client2.connect(5000, 'localhost', () => {
      client2.write('INVALID,DATA,HERE\n');
      console.log('   📤 Sent: INVALID,DATA,HERE');
      client2.destroy();
      
      setTimeout(() => {
        // Test 3: Missing Fields
        console.log('\n3️⃣ Sending packet with MISSING fields...');
        const client3 = new net.Socket();
        client3.connect(5000, 'localhost', () => {
          client3.write('PING,354678901234561,18.5204\n');
          console.log('   📤 Sent: PING,354678901234561,18.5204 (missing fields)');
          client3.destroy();
          
          console.log('\n✅ Error handling tests complete!');
          console.log('   Check server logs to see how errors were handled.');
          process.exit(0);
        });
      }, 1000);
    });
  }, 1000);
});
