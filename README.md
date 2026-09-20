# CRM

CRM general (estilo HubSpot): contactos y segmentación, oportunidades/embudo de ventas, actividades/seguimiento y reportes. Web desktop/móvil, alojado en infraestructura propia.

## Stack

- Monorepo: pnpm workspaces + Turborepo
- `apps/web` — Next.js 16 (App Router) + Tailwind + shadcn/ui (PWA)
- `apps/api` — BFF Fastify + zod + Drizzle (PostgreSQL) + Redis
- Infra local: Docker Compose (PostgreSQL 16, Redis 7, MinIO S3)

## Requisitos

- Node.js 24 (`.nvmrc`)
- pnpm 12 (instalar con `npm i -g pnpm`)
- Docker + Docker Compose

## Arranque rápido

```sh
# 1. Copiar entorno
cp .env.example .env

# 2. Servicios de infraestructura (Postgres, Redis, MinIO)
docker compose up -d

# 3. Instalar dependencias
pnpm install

# 4. Migrar BD + seed (admin)
pnpm --filter @crm/api db:migrate && pnpm --filter @crm/api db:seed

# 5. Correr dev (web en :3000, api en :3001)
pnpm dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Dev de todas las apps |
| `pnpm build` | Build de producción |
| `pnpm lint` | Lint |
| `pnpm typecheck` | Validación de tipos |
| `pnpm format:write` | Formato con Prettier |
| `pnpm format:check` | Chequeo de formato |

## Estructura

```
apps/
  api/        # BFF (Fastify)
  web/        # Frontend (Next.js)
packages/     # Paquetes compartidos
```

## Fase actual

Fase 5 — Reportes / dashboards (completa):

- **Dashboard ejecutivo**: KPIs (contactos, oportunidades, actividades, importe ganado, ganadas/perdidas, hechas/pendientes) con rango de fechas (presets: semana/mes/trimestre/año + personalizado).
- **Embudo de ventas**: conversión por etapa (conteo + importe), ciclo medio en días, tasa de conversión, ganadas/perdidas; visibilidad por propietario.
- **Actividad del equipo**: totales por vendedor (total/hechas/pendientes), por tipo (llamada/correo/reunión/tarea/nota), por estado (pendiente/hecha/cancelada).
- **RBAC**: `reportes:leer` para `admin` y `vendedor`; vendedor ve solo sus datos, admin ve todos.
- **Frontend**: `/reportes` con pestañas (Dashboard / Embudo / Actividad), selector de rango con presets, tarjetas KPI, tablas ordenadas; sin dependencias de gráficos pesadas.
- **Endpoints**: `GET /reportes/dashboard`, `GET /reportes/embudo`, `GET /reportes/actividad` (todos con `?preset=mes|semana|trimestre|anio` o `?desde=...&hasta=...`).

Fases anteriores:

- **Fase 4 — Actividades / seguimiento**: tabla `actividades` (5 tipos, vencimiento, estado, contacto/oportunidad opcional), CRUD, panel pendientes en `/resumen`.
- **Fase 3 — Oportunidades / embudo de ventas**: tabla `oportunidades`, 6 etapas fijas, tablero Kanban, visibilidad por propietario.
- **Fase 2 — Contactos y segmentación**: tabla `contactos` (email único parcial), CRUD con filtros ad-hoc.
- **Fase 1 — Plataforma base**: auth (sesiones Redis, cookie `crm_session`, scrypt), RBAC, rate limiting, zod, usuarios.

Credenciales seed: `admin@crm.local` / `admin1234` (configurable vía `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

## Siguientes fases

1. Mobile / PWA + hardening

## Despliegue por empresa (producción)

Cada empresa corre su propio stack (single-tenant): Postgres, Redis, MinIO, API, worker y web con su dominio. Nada se comparte entre empresas.

### 1. Secretos por despliegue (generar uno distinto por cliente)

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # MICROSOFT_CRYPTO_KEY
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))" # JWT_SECRET / SESSION_SECRET
```

| Variable | Uso | Cambiar |
|---|---|---|
| `POSTGRES_PASSWORD` | Postgres | Sí, único por cliente |
| `JWT_SECRET`, `SESSION_SECRET` | Sesiones web | Sí (mín. 32 caracteres) |
| `MICROSOFT_CRYPTO_KEY` | Cifra tokens OAuth y secrets en reposo (AES-256-GCM). Si difiere entre api y worker, no se descifra | Sí, hex 32 bytes; **misma** en api y worker |
| `MINIO_ROOT_USER/PASSWORD` | Objetos | Sí |
| `CORS_ORIGIN`, `FRONTEND_URL` | Dominio del cliente | Sí |
| `CURRENCY` | `MXN` (defecto) o `USD` | Según cliente |
| `GRAPH_PUBLIC_URL` | URL pública del API para webhooks de Microsoft | Sí (HTTPS) |

### 2. HTTPS y dominios

- El callback OAuth (`/api/auth/microsoft/callback`, `/api/auth/google/callback`) y los webhooks (`/api/graph/notify`) exigen **HTTPS pública**. Termina TLS en el reverse proxy del cliente y ajusta `redirectUri` en el IdP y en Configuración.
- Tras cambiar a HTTPS, cada empleado debe **reconectar** su buzón (los scopes nuevos como `Calendars.Read` solo se otorgan al consentir de nuevo).

### 3. Integraciones por empresa (un App Registration / proyecto OAuth por despliegue)

- Microsoft Entra: app single-tenant del cliente, redirect al callback del API, permisos delegados `Mail.Read Mail.Send Calendars.Read User.Read offline_access`. Cargar en Configuración (admin).
- Google Cloud: OAuth web con redirect al callback de Google. Cargar en Configuración (admin).
- Los empleados solo usan "Conectar"; nunca ven secretos (endpoints 403 para no-admin).

### 4. Respaldos

```powershell
.\scripts\backup.ps1            # genera .\backups\crm-YYYYMMDD-HHmmss.sql
.\scripts\restore.ps1 -File .\backups\crm-....sql
```

Respaldar además el volumen `minio_data` (archivos) si el cliente usa adjuntos.

### 5. Retención y limpieza automática (worker)

- `webhook_deliveries`: últimas 100 por endpoint.
- `api_tokens` expirados: borrado diario.
- Objetos huérfanos MinIO (>1h sin fila): borrado diario.
- `email_tracking` y actividades se conservan (son dato de negocio/campañas).