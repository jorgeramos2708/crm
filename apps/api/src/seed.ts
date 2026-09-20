import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { users } from './db/schema.js'
import bcrypt from 'bcryptjs'

const pool = new pg.Pool({
  connectionString: 'postgres://crm:crm_dev_password@postgres:5432/crm',
})

const db = drizzle(pool)

async function seed() {
  const hash = await bcrypt.hash('admin1234', 12)
  await db.insert(users).values({
    email: 'admin@crm.local',
    passwordHash: hash,
    name: 'Admin',
    role: 'admin',
    activo: true
  }).onConflictDoNothing()
  console.log('Admin created')
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})