import 'dotenv/config';
import Fastify from 'fastify';
import { env } from './config.js';
import { registerAuthRoutes } from './routes/index.js';
import { connectDB } from './db/index.js';
import { connectRedis } from './services/redis.js';

const app = Fastify({
  logger: env.NODE_ENV !== 'production',
  ajv: { customOptions: { removeAdditional: 'all' } },
  // Tras nginx: IP real viene en X-Forwarded-For
  trustProxy: true,
});

await app.register(import('@fastify/helmet'), {
  // Swagger UI requiere inline scripts/styles
  contentSecurityPolicy: false,
});
await app.register(import('@fastify/swagger'), {
  openapi: {
    info: { title: 'CRM API', description: 'API del CRM (single-tenant por despliegue)', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'crm_...' },
        cookie: { type: 'apiKey', in: 'cookie', name: 'token' },
      },
    },
    security: [{ cookie: [] }, { bearer: [] }],
  },
});
await app.register(import('@fastify/swagger-ui'), { routePrefix: '/api/docs' });
await app.register(import('@fastify/cors'), {
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
});
await app.register(import('@fastify/cookie'), {
  secret: env.SESSION_SECRET,
  parseOptions: {}
});

// Límite global (defensa en profundidad; nginx ya limita por IP al borde)
await app.register(import('@fastify/rate-limit'), {
  max: env.RATE_LIMIT_MAX,
  timeWindow: `${env.RATE_LIMIT_WINDOW_SECONDS} seconds`,
});

await app.register(import('@fastify/multipart'), {
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

// Tolerar clientes que envían Content-Type: application/json con body vacío
// (p. ej. DELETEs desde PowerShell): evita FST_ERR_CTP_EMPTY_JSON_BODY.
app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    if (!body || (typeof body === 'string' && body.length === 0)) return done(null, undefined);
    done(null, typeof body === 'string' ? JSON.parse(body) : body);
  } catch (err) {
    done(err as Error, undefined);
  }
});

// UUID malformado en params → 404 en vez de 500 (Postgres 22P02)
app.setErrorHandler((error: any, req, reply) => {
  const pgCode = error?.cause?.code || error?.code;
  if (pgCode === '22P02') {
    return reply.code(404).send({ error: 'No encontrado', code: 'NOT_FOUND' });
  }
  throw error;
});

await connectDB();
await connectRedis();

const { ensureBucket } = await import('./services/storage.js');
await ensureBucket();

await registerAuthRoutes(app);

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  console.log(`🚀 API running at http://${env.HOST}:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}