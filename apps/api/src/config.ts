export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3001", 10),
  HOST: process.env.HOST || "0.0.0.0",

  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://crm:crm_dev_password@postgres:5432/crm",
  REDIS_URL: process.env.REDIS_URL || "redis://redis:6379",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:8081",

  SESSION_SECRET:
    process.env.SESSION_SECRET ||
    "crm-super-secret-change-in-production-min-32-chars",
  SESSION_COOKIE: process.env.SESSION_COOKIE || "crm_session",
  SESSION_TTL_SECONDS: parseInt(
    process.env.SESSION_TTL_SECONDS || "604800",
    10,
  ), // 7 días

  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "300", 10),
  RATE_LIMIT_WINDOW_SECONDS: parseInt(
    process.env.RATE_LIMIT_WINDOW_SECONDS || "60",
    10,
  ),

  JWT_SECRET:
    process.env.JWT_SECRET || "jwt-secret-change-in-production-min-32-chars",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Clave hex de 32 bytes para cifrar tokens OAuth y clientSecret en reposo.
  // Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  MICROSOFT_CRYPTO_KEY: process.env.MICROSOFT_CRYPTO_KEY || "",

  // URL pública del API (para notificationUrl de webhooks Graph). Por despliegue.
  GRAPH_PUBLIC_URL: process.env.GRAPH_PUBLIC_URL || "http://localhost:3001",

  // Moneda del despliegue. MXN por defecto, USD opcional (sin EUR).
  CURRENCY: ["USD", "MXN"].includes(process.env.CURRENCY || "")
    ? (process.env.CURRENCY as string)
    : "MXN",

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),

  // SMTP saliente (Fase 0). Sin SMTP_HOST => dry-run (log, no envía).
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "",
} as const;

export type Env = typeof env;
