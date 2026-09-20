import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config.js';
import * as schema from './schema.js';

const { Pool } = pg;

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

export async function connectDB() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err);
    throw err;
  }
}

export async function closeDB() {
  await pool.end();
}