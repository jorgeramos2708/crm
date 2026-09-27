# CRM Architecture Documentation

> **Version**: 3.0  
> **Last Updated**: 2026-09-26  
> **Status**: Production Ready (Phases 1-3 Complete)  
> **Repository**: `C:\Proyectos-IA\crm`

---

## 🎯 Executive Summary

This CRM is a **multi-tenant, offline-first, AI-enhanced** sales platform built with modern cloud-native architecture. It competes with Pipedrive, Close, and Attio by combining:

- **Email-native** workflow (bidirectional, threaded, sequences)
- **Mobile-first offline** capability (PWA → Capacitor → Native)
- **AI-powered forecasting** (win probability + next-best-action)
- **Multi-tenant SaaS** with Stripe billing
- **Immutable audit log** (GDPR/SOC2 ready)

---

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph EXT["🌐 EXTERNAL"]
        Users["👥 Users"]
        Email["📧 Email Systems"]
        Webhooks["🔗 Webhooks"]
        ExtAPI["🔗 External APIs"]
    end

    subgraph EDGE["🛡️ EDGE"]
        NGINX["NGINX\nSSL + Rate Limit"]
        Kong["Kong Gateway\nAuth + Tenant"]
        WAF["WAF"]
    end

    subgraph FE["🎨 FRONTEND"]
        Web["Vue 3 + Pinia\n19 Views + ⌘K"]
        Mobile["Capacitor + Vue\nOffline-First"]
        Portal["Buyer Portal"]
    end

    subgraph API["🚀 API LAYER"]
        Gateway["Fastify\n147 Endpoints"]
        Workers["BullMQ Workers\n8 Types"]
        Services["Internal Services\n15+ Modules"]
    end

    subgraph DATA["💾 DATA LAYER"]
        PG[("PostgreSQL 16\nRLS + Partitions")]
        Redis[("Redis Cluster\nStreams + BullMQ")]
        MinIO[("MinIO S3")]
        Meili[("Meilisearch")]
        Audit[("Audit Log\nHash Chain")]
    end

    subgraph ML["🤖 ML SERVICE"]
        ML_API["FastAPI\nWin Prob + NBA"]
        FeatureEng["Feature Engineering"]
        ModelTrain["XGBoost/LightGBM"]
        NBA["Next-Best-Action"]
    end

    subgraph INFRA["☁️ INFRASTRUCTURE"]
        K8s["Kubernetes\nArgoCD GitOps"]
        Prometheus["Prometheus\nGrafana"]
        Loki["Loki + Tempo"]
        ArgoCD["ArgoCD"]
    end

    EXT --> EDGE
    EDGE --> FE
    EDGE --> API
    FE -.->|HTTPS/WS| API
    Mobile -.->|HTTPS/WS| API
    API --> Workers
    API --> Services
    Services -.-> PG
    Services -.-> Redis
    Services -.-> MinIO
    Services -.-> ML_API
    Workers -.-> Redis
    Workers -.-> PG
    Workers -.-> External
    ML_API -.-> PG
    ML_API -.-> Redis
    ML_API -.-> External
    K8s --> Prometheus
    Prometheus --> Grafana
    K8s --> Loki
    Loki --> Grafana
    K8s --> Tempo
    Tempo --> Grafana
    Prometheus --> AlertManager
    AlertManager --> Slack
```

---

## 📦 Repository Structure

```
crm/
├── apps/
│   ├── api/                    # Fastify 5 + TypeScript
│   │   ├── src/
│   │   │   ├── routes/         # 147 endpoints (index.ts)
│   │   │   ├── middleware/     # auth, tenant, rate-limit
│   │   │   ├── services/       # 15+ internal services
│   │   │   ├── workers/        # BullMQ workers (8 types)
│   │   │   ├── db/             # Drizzle ORM + schema
│   │   │   ├── middleware/     # auth, tenant, rate-limit
│   │   │   └── utils/          # crypto, csv, etc.
│   │   ├── tests/              # 56 tests (Vitest)
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── web/                    # Vue 3 + Vite + Pinia
│   │   ├── src/
│   │   │   ├── views/          # 19 views
│   │   │   ├── components/     # 30+ components
│   │   │   ├── stores/         # Pinia stores (auth, ui, offline)
│   │   │   ├── components/     # 30+ reusable components
│   │   │   ├── utils/          # axios, currency, toast, etc.
│   │   │   └── main.ts         # App entry + router
│   │   ├── tests/              # 114 tests (Vitest + Vue Test Utils)
│   │   ├── Dockerfile.vue
│   │   └── package.json
│   │
│   └── mobile/                 # Capacitor + Vue 3 (future)
│       ├── capacitor.config.ts
│       ├── src/                # Shared with web
│       └── capacitor.config.ts
│
├── packages/                   # Shared packages (future)
│   ├── ui/                     # Shared components
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Shared utilities
│
├── ml/                         # ML Service (FastAPI + Python)
│   ├── api/                    # FastAPI endpoints
│   ├── features/               # Feature engineering
│   ├── models/                 # XGBoost/LightGBM models
│   ├── pipelines/              # Prefect pipelines
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml          # Local development
├── docker-compose.prod.yml     # Production overrides
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml
├── package.json                # Root package.json
├── pnpm-lock.yaml
├── .github/workflows/          # CI/CD pipelines
├── .husky/                     # Git hooks
├── .prettierrc
├── .eslintrc
├── .gitignore
├── AGENTS.md                   # Agent instructions
├── README.md                   # Project README
├── ARCHITECTURE.md             # This file
└── ARCHITECTURE-*.mmd          # Mermaid diagrams
```

---

## 🔧 Technology Stack

### Frontend (apps/web)

| Category   | Technology              | Version |
| ---------- | ----------------------- | ------- |
| Framework  | Vue 3                   | 3.5.x   |
| Build      | Vite                    | 5.x     |
| State      | Pinia                   | 2.x     |
| Styling    | Tailwind CSS            | 3.4.x   |
| Components | Headless UI + Reka UI   | Latest  |
| Icons      | Lucide Vue Next         | Latest  |
| Charts     | Chart.js + vue-chartjs  | Latest  |
| Testing    | Vitest + Vue Test Utils | Latest  |
| Linting    | ESLint + Prettier       | Latest  |
| PWA        | Vite PWA Plugin         | Latest  |

### Backend (apps/api)

| Category   | Technology                        | Version    |
| ---------- | --------------------------------- | ---------- |
| Runtime    | Node.js                           | 20.x (LTS) |
| Framework  | Fastify                           | 5.x        |
| Language   | TypeScript                        | 5.x        |
| ORM        | Drizzle ORM                       | Latest     |
| Database   | PostgreSQL                        | 16         |
| Queue      | BullMQ + Redis                    | Latest     |
| Auth       | JWT + bcrypt (12)                 | -          |
| Validation | Zod + fastify-type-provider-zod   | Latest     |
| Email      | Nodemailer + Microsoft Graph      | Latest     |
| Search     | Meilisearch                       | v1.11      |
| ML         | Python FastAPI + XGBoost/LightGBM | 3.11       |
| Testing    | Vitest + Supertest                | Latest     |

### Infrastructure

| Component     | Technology                   | Version |
| ------------- | ---------------------------- | ------- |
| Container     | Docker                       | 24.x    |
| Orchestration | Kubernetes (EKS/GKE)         | 1.28+   |
| GitOps        | ArgoCD                       | Latest  |
| CI/CD         | GitHub Actions               | Latest  |
| Monitoring    | Prometheus + Grafana         | Latest  |
| Logging       | Loki + Promtail              | Latest  |
| Tracing       | Tempo                        | Latest  |
| Secrets       | SealedSecrets / Vault        | Latest  |
| DNS           | ExternalDNS                  | Latest  |
| TLS           | Cert-Manager + Let's Encrypt | Latest  |

---

## 🗄️ Database Schema (PostgreSQL 16)

### Core Tables (30+)

```sql
-- Multi-tenancy root
tenants (id, nombre, subdominio, plan, estado, stripe_*, configuracion JSONB)

-- Core CRM
users, contactos, companies, contact_companies
oportunidades, pipelines, pipeline_stages
productos, presupuestos
contactos, contact_companies, contact_lists, contact_list_members

-- Email & Marketing
email_templates, email_campaigns, email_threads, email_messages
email_sequences, sequence_enrollments, email_tracking, email_subscriptions
contact_lists, contact_list_members

-- Automation & Tasks
automatizaciones, tareas, activities
webhook_endpoints, webhook_deliveries

-- Files & Integrations
archivos, google_config, google_tokens, microsoft_config, microsoft_graph_tokens
custom_fields, vistas_guardadas, equipos, equipo_miembros

-- Security & Audit
permisos, audit_log (PARTITIONED BY MONTH), api_tokens, ajustes
```

### Key Features

- **Row Level Security (RLS)** on ALL tenant tables
- **Partitioned audit_log** by month (pg_partman)
- **Hash chain** on audit_log (SHA256 chaining)
- **Cryptographic verification** of audit trail
- **Multi-tenant isolation** via `set_tenant_context()`

---

## 🔄 Data Flow Architecture

### 1. Email Bidirectional Flow

```
Email (SMTP/Graph/IMAP)
    → NGINX → Inbound Worker → Mailparser
    → Thread Detection (Message-ID/References)
    → Contact Match → PostgreSQL
    → Thread + Message + Activity
    → Push Notification → WebSocket → Frontend
```

### 2. Mobile Offline-First Sync

```
User Action (offline)
    → IndexedDB (optimistic)
    → pendingMutations queue
    → Background Sync (Background Sync API)
    → Pull (server → IndexedDB)
    → Push (mutations queue)
    → Conflict Resolution (Yjs/Automerge CRDT)
    → Real-time UI update
```

### 3. ML Forecasting Pipeline

```
Daily (03:00 UTC):
  Prefect Scheduler → Feature Engineering (SQL + Pandas)
    → XGBoost/LightGBM Training (TimeSeriesSplit CV)
    → MLflow Tracking → Model Registry
    → Auto-promote if AUC +1% → Blue/Green Deploy

Real-time:
  Deal change → Feature Engineering (real-time SQL)
    → XGBoost Predict → NBA Engine (rules + ML)
    → WebSocket push → DealForecastCard + NBAFeed
```

---

## 🔐 Security Architecture

### Defense in Depth

```
Internet → WAF (NGINX) → Kong Gateway (Auth + Rate Limit)
    → Fastify (Auth Middleware + Tenant Middleware)
    → PostgreSQL (RLS Policies)
    → Audit Log (Hash Chain)
```

### Authentication & Authorization

- **JWT** (7d expiry, HS256, httpOnly cookies)
- **bcrypt** (cost 12) for passwords
- **OAuth 2.0** (Google + Microsoft) with PKCE
- **API Tokens** (SHA-256 hashed, prefix `crm_`)
- **RBAC** per module (r/w/x) + **ABAC** (OPA-ready)
- **RLS** on ALL tenant tables

### Data Protection

- **Encryption at rest**: PostgreSQL (TDE), MinIO (SSE-S3), Redis (TLS)
- **Encryption in transit**: TLS 1.3 everywhere, mTLS ready
- **Secrets**: SealedSecrets + Vault, zero hardcoded secrets
- **PII**: Pseudonymization in audit logs, GDPR export/delete

---

## 📊 Observability Stack

### Metrics (Prometheus + Grafana)

- **RED Metrics**: Rate, Errors, Duration (per endpoint)
- **USE Metrics**: Utilization, Saturation, Errors (per resource)
- **Business Metrics**: Pipeline value, win rate, email delivery
- **SLOs**: Latency p99 < 200ms, Availability 99.9%, Error rate < 0.1%

### Logging (Loki + Grafana)

- Structured JSON logs (pino)
- Labels: service, environment, tenant, trace_id
- LogQL queries for debugging

### Tracing (Tempo + Grafana)

- OpenTelemetry instrumentation (Fastify + Workers)
- TraceQL queries
- Service graph visualization

### Alerting (AlertManager)

- **Channels**: Slack, PagerDuty, Email
- **Rules**: SLO burn rate, error rate, latency, disk/memory
- **Inhibition**: Reduce noise during incidents

---

## 🚀 CI/CD Pipeline (GitOps)

```mermaid
graph LR
    Commit["📝 git commit"] --> Push["📤 git push"]
    Push --> Lint["🔍 Lint + TypeCheck"]
    Lint --> UnitTest["🧪 Unit Tests (114)"]
    UnitTest --> Build["🐳 Build Docker\nMulti-stage + SBOM"]
    Build --> Security["🔒 Security\nTrivy + CodeQL"]
    Security --> Contract["📋 Contract Tests\nPact + Schema Lock"]
    Contract --> Staging["🚀 Deploy Staging\nArgoCD Sync"]
    Staging --> Approve["✅ Manual Approve\nSlack Notify"]
    Approve --> Canary["🐤 Canary 10%\n10min Observation"]
    Canary --> Production["🚀 Production\nBlue/Green\nRollback < 2min"]
    Production --> Smoke["💨 Smoke Tests"]
    Smoke --> Monitor["📊 SLO Monitoring"]
    Monitor --> Notify["📢 Slack + Email"]
```

### Quality Gates

- **TypeScript**: Strict mode, no `any`
- **Tests**: 114 unit + 56 integration = 170 total
- **Coverage**: >80% (enforced)
- **Security**: Trivy (container), CodeQL (SAST), Dependabot
- **Contracts**: Pact (provider), Schema lock (golden file)

---

## 📱 Mobile Architecture (Capacitor + Vue 3)

### Offline-First Stack

| Layer               | Technology                    |
| ------------------- | ----------------------------- |
| Framework           | Capacitor 6 + Vue 3           |
| Offline DB          | Dexie.js (IndexedDB wrapper)  |
| Sync Engine         | RxDB (PouchDB-compatible)     |
| Conflict Resolution | Yjs / Automerge (CRDT)        |
| Push                | Capacitor Push + Firebase     |
| Background Sync     | Workbox + Background Sync API |

### Offline Capabilities

- **Full CRUD** offline (contacts, deals, tasks, emails)
- **Optimistic UI** with immediate feedback
- **Mutation queue** with exponential backoff retry
- **Conflict resolution**: Yjs/Automerge CRDT + UI for manual resolution
- **Background sync**: Periodic Sync API + Workbox
- **Push notifications**: FCM/APNs with deep linking

---

## 🤖 ML Service Architecture

### Model Pipeline

```
Daily Retrain (03:00 UTC):
  Prefect Scheduler
    → Feature Engineering (SQL + Pandas, ~50k deals × 80 features)
    → XGBoost/LightGBM Training (TimeSeriesSplit CV)
    → MLflow Tracking (AUC, Brier, Calibration)
    → PSI Drift Check (>0.1 = alert)
    → MLflow Registry → Auto-promote if AUC +1%
    → Blue/Green Deploy (ML API)

Real-time Inference:
  Deal change → Feature Engineering (real-time SQL)
    → XGBoost Predict → NBA Engine (rules + ML prob)
    → WebSocket push → DealForecastCard + NBAFeed
```

### Models

| Model            | Algorithm  | Target            | Features         | Serving |
| ---------------- | ---------- | ----------------- | ---------------- | ------- |
| Win Probability  | XGBoost    | Binary (won/lost) | 80 features      | FastAPI |
| Lead Scoring     | LightGBM   | Score 0-100       | Fit + Engagement | FastAPI |
| Next-Best-Action | Rules + ML | Action ranking    | SHAP + Rules     | FastAPI |

### MLOps

- **Tracking**: MLflow (experiments, params, metrics, artifacts)
- **Registry**: Model versioning, staging/production aliases
- **Drift Detection**: PSI > 0.1 → auto-retrain trigger
- **A/B Testing**: Traffic split, statistical significance
- **Monitoring**: Prediction latency, drift, feature importance

---

## 🏢 Multi-Tenancy & Billing

### Tenant Isolation

- **Schema**: Single database, `tenant_id` on ALL tables
- **RLS**: `CREATE POLICY tenant_isolation ON table USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`
- **Resolution**: Subdomain (`tenant.crm.com`) → Header (`x-tenant-id`) → JWT claim
- **Middleware**: `tenantMiddleware` sets `set_tenant_context(tenant_id)` per request

### Billing (Stripe)

| Plan         | Users | Contacts | Emails/mo | Storage | Price     |
| ------------ | ----- | -------- | --------- | ------- | --------- |
| Starter      | 5     | 1,000    | 1,000     | 100MB   | Free      |
| Professional | 25    | 50,000   | 50,000    | 5GB     | $49/u/mo  |
| Enterprise   | ∞     | ∞        | ∞         | ∞       | $129/u/mo |

### Billing Flow

```
Stripe Webhook → invoice.paid/failed
    → Update tenant.plan, tenant.estado, tenant.fecha_vencimiento
    → Enforce limits in middleware (maxUsers, maxContacts, etc.)
    → Stripe Customer Portal (self-service)
```

---

## 📝 Audit & Compliance

### Immutable Audit Log

- **Append-only** table `audit_log` (partitioned by month)
- **Hash Chain**: `hash_n = SHA256(hash_{n-1} || event_n || timestamp)`
- **Verification**: `verifyChain()` recalculates hashes, detects tampering
- **Categories**: `data`, `auth`, `access`, `admin`, `security`
- **Risk Levels**: `low`, `medium`, `high`, `critical`

### GDPR Compliance

- **Export**: `exportUserData(tenantId, userId)` → JSON download
- **Right to be Forgotten**: `pseudonymizeUser()` → hash actorId + null PII
- **Consent**: Double opt-in email subscriptions, unsubscribe tracking

### SOC2 Readiness

- **Audit Log**: Immutable, tamper-evident, queryable
- **Access Control**: RBAC + ABAC, field-level permissions
- **Encryption**: At rest + in transit, key rotation
- **Monitoring**: Immutable logs, alerting on anomalies
- **Reports**: `generateComplianceReport()` for auditors

---

## 📱 Mobile App Distribution

### Build Pipeline

```
Capacitor Sync → iOS/Android Builds
  → TestFlight / Play Console Internal
  → Screenshots + Metadata + Privacy Policy
  → Staged Rollout (10% → 50% → 100%)
  → Crash Reporting (Sentry) + Analytics
```

### App Store Compliance

- **Privacy Policy**: GDPR/CCPA compliant
- **Permissions**: Camera (scan), Location (check-in), Biometric (auth)
- **Offline**: Works fully offline, syncs when online
- **Accessibility**: WCAG 2.1 AA, VoiceOver/TalkBack support

---

## 📁 Diagram Files

All diagrams are available as Mermaid (`.mmd`) files:

| File                              | Description                  |
| --------------------------------- | ---------------------------- |
| `architecture.mmd`                | Complete system architecture |
| `architecture-email.mmd`          | Email bidirectional flow     |
| `architecture-mobile-sync.mmd`    | Mobile offline sync          |
| `architecture-forecasting-ml.mmd` | ML forecasting pipeline      |
| `architecture-multi-tenant.mmd`   | Multi-tenant RLS flow        |
| `architecture-audit-log.mmd`      | Audit log hash chain         |
| `architecture-ml-pipeline.mmd`    | ML training + serving        |
| `architecture-security.mmd`       | Security boundaries          |
| `architecture-cicd.mmd`           | CI/CD GitOps pipeline        |
| `architecture-data-model.mmd`     | ERD (Mermaid)                |
| `architecture-data-flow.mmd`      | Data flow layers             |
| `architecture-cicd.mmd`           | CI/CD pipeline               |
| `architecture-security.mmd`       | Security boundaries          |
| `architecture-data-flow.mmd`      | Data flow layers             |

**View**: Open `.mmd` files in VS Code (Markdown Preview), GitHub/GitLab, Notion, or [Mermaid Live](https://mermaid.live)

---

## 🚀 Quick Start (Development)

```bash
# Prerequisites
pnpm@12.x, Node.js 20+, Docker Desktop, pnpm@12

# Clone & Install
git clone <repo>
cd crm
pnpm install

# Start Infrastructure
docker compose up -d postgres redis minio meilisearch

# Start API (Terminal 1)
cd apps/api
cp .env.example .env
pnpm dev

# Start Web (Terminal 2)
cd apps/web
pnpm dev

# Run Tests
cd apps/web && pnpm test --run
cd apps/api && pnpm test

# Build for Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Environment Variables (`.env`)

```bash
# Required
DATABASE_URL=postgresql://crm:password@localhost:5432/crm
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-32-chars-minimum
SESSION_SECRET=your-super-secret-32-chars-minimum
MICROSOFT_CRYPTO_KEY=64-char-hex-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MEILI_MASTER_KEY=your-master-key
CLEARBIT_API_KEY=sk_...
APOLLO_API_KEY=...
SENTRY_DSN=https://...
FRONTEND_URL=http://localhost:8081
CORS_ORIGIN=http://localhost:8081
```

---

## 📚 Additional Documentation

| Document          | Location                         |
| ----------------- | -------------------------------- |
| API Reference     | `/api/docs` (Swagger UI)         |
| Developer Guide   | `DEVELOPER_GUIDE.md`             |
| Deployment Guide  | `DEPLOYMENT.md`                  |
| Security Policy   | `SECURITY.md`                    |
| Contributing      | `CONTRIBUTING.md`                |
| Changelog         | `CHANGELOG.md`                   |
| API Contracts     | `apps/api/contracts.golden.json` |
| Component Library | `apps/web/src/components/`       |

---

## 🤝 Contributing

1. Fork → Feature branch (`feat/xxx` or `fix/xxx`)
2. Commit: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`)
3. PR: Description + Tests + Screenshots (UI)
4. Review: 2 approvals + CI green
5. Merge: Squash + merge to `main`

---

## 📄 License

Proprietary - All rights reserved.

---

## 📞 Support

- **Issues**: GitHub Issues
- **Security**: `security@crm.local`
- **Docs**: `/docs` (this repo)
- **Slack**: `#crm-dev`

---

_Generated from architecture diagrams and codebase analysis. Keep this document updated with each release._
