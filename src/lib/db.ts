import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

// Allow build to succeed without DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder';

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  DATABASE_URL not set, using placeholder for build');
}

// Create connection pool with Railway-friendly settings
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // Maximum pool size for handling concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for Railway
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Graceful shutdown
export async function closeDatabase() {
  await pool.end();
}
