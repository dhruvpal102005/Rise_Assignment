import { pgTable, text, uuid, timestamp, varchar, decimal, boolean, integer, index } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull(), // 'Admin' or 'Customer'
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Devices table
export const devices = pgTable('devices', {
  imei: varchar('imei', { length: 15 }).primaryKey(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }),
  customerId: uuid('customer_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  imeiIdx: index('devices_imei_idx').on(table.imei),
  customerIdx: index('devices_customer_idx').on(table.customerId),
}));

// Location logs table
export const locationLogs = pgTable('location_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  imei: varchar('imei', { length: 15 }).notNull().references(() => devices.imei),
  lat: decimal('lat', { precision: 10, scale: 7 }).notNull(),
  lng: decimal('lng', { precision: 10, scale: 7 }).notNull(),
  speed: decimal('speed', { precision: 6, scale: 2 }).notNull(),
  ignition: boolean('ignition').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  imeiIdx: index('location_logs_imei_idx').on(table.imei),
  timestampIdx: index('location_logs_timestamp_idx').on(table.timestamp),
  imeiTimestampIdx: index('location_logs_imei_timestamp_idx').on(table.imei, table.timestamp),
}));

export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type LocationLog = typeof locationLogs.$inferSelect;
