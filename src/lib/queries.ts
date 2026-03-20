import { db } from './db';
import { users, devices, locationLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// User queries
export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user || null;
}

// Device queries
export async function getAllDevices() {
  return await db.select().from(devices);
}

export async function findDeviceByImei(imei: string) {
  const [device] = await db.select().from(devices).where(eq(devices.imei, imei)).limit(1);
  return device || null;
}

export async function getRegisteredDeviceImeis(): Promise<Set<string>> {
  const allDevices = await db.select({ imei: devices.imei }).from(devices);
  return new Set(allDevices.map(d => d.imei));
}

export async function getDevicesByCustomerId(customerId: string) {
  return await db.select().from(devices).where(eq(devices.customerId, customerId));
}

// Location log queries
export async function getLocationLogsByImei(imei: string, limit: number = 100) {
  return await db
    .select()
    .from(locationLogs)
    .where(eq(locationLogs.imei, imei))
    .orderBy(desc(locationLogs.timestamp))
    .limit(limit);
}

export async function addLocationLog(data: {
  imei: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  timestamp: Date;
}) {
  await db.insert(locationLogs).values({
    imei: data.imei,
    lat: data.lat.toString(),
    lng: data.lng.toString(),
    speed: data.speed.toString(),
    ignition: data.ignition,
    timestamp: data.timestamp,
  });
}

export async function batchInsertLocationLogs(logs: Array<{
  imei: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  timestamp: Date;
}>) {
  if (logs.length === 0) return;
  
  await db.insert(locationLogs).values(
    logs.map(log => ({
      imei: log.imei,
      lat: log.lat.toString(),
      lng: log.lng.toString(),
      speed: log.speed.toString(),
      ignition: log.ignition,
      timestamp: log.timestamp,
    }))
  );
}
