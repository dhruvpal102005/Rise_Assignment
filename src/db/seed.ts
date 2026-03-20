import 'dotenv/config';
import { db } from '@/lib/db';
import { users, devices } from './schema';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create 2 users: 1 Admin, 1 Customer
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [admin] = await db.insert(users).values({
      email: 'admin@fleetpulse.com',
      role: 'Admin',
      passwordHash: hashedPassword,
    }).returning();

    const [customer] = await db.insert(users).values({
      email: 'customer@example.com',
      role: 'Customer',
      passwordHash: hashedPassword,
    }).returning();

    console.log('✅ Created users:', { admin: admin.email, customer: customer.email });

    // Create 5 registered devices
    const deviceData = [
      { imei: '354678901234561', vehicleNumber: 'MH-01-AB-1234', customerId: customer.id },
      { imei: '354678901234562', vehicleNumber: 'MH-02-CD-5678', customerId: customer.id },
      { imei: '354678901234563', vehicleNumber: 'MH-03-EF-9012', customerId: customer.id },
      { imei: '354678901234564', vehicleNumber: 'DL-01-GH-3456', customerId: null }, // Unassigned
      { imei: '354678901234565', vehicleNumber: 'KA-05-IJ-7890', customerId: null }, // Unassigned
    ];

    await db.insert(devices).values(deviceData);

    console.log('✅ Created 5 registered devices');
    console.log('\n📋 Seed Summary:');
    console.log('Admin: admin@fleetpulse.com / password123');
    console.log('Customer: customer@example.com / password123');
    console.log('Customer owns 3 devices (IMEIs ending in 561, 562, 563)');
    console.log('2 devices unassigned (IMEIs ending in 564, 565)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
