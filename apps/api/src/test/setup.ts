import { beforeAll, afterAll, vi } from 'vitest'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://crm:crm_dev_password@localhost:5433/crm',
})

beforeAll(async () => {
  await pool.query('SELECT 1')
  console.log('✅ Test DB connected')
})

afterAll(async () => {
  await pool.end()
})

vi.mock('../services/redis.js', () => ({
  connectRedis: vi.fn().mockResolvedValue(undefined),
  getRedis: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  }),
}))

export { pool }