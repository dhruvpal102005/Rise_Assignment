import { PrismaClient, Role } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = crypto.createHash('sha256').update('password123').digest('hex');

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      role: Role.Admin,
      passwordHash,
    },
  });

  // 2. Create Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      role: Role.Customer,
      passwordHash,
    },
  });

  // 3. Create 5 Devices for the Customer
  const deviceData = [
    { imei: '354678901234561', vehicleNumber: 'KA-01-HH-1234' },
    { imei: '354678901234562', vehicleNumber: 'KA-01-HH-5678' },
    { imei: '354678901234563', vehicleNumber: 'MH-01-AB-1234' },
    { imei: '354678901234564', vehicleNumber: 'DL-01-CD-5678' },
    { imei: '354678901234565', vehicleNumber: 'TS-01-EF-9012' },
  ];

  for (const data of deviceData) {
    await prisma.device.upsert({
      where: { imei: data.imei },
      update: {},
      create: {
        ...data,
        customerId: customer.id,
      },
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
