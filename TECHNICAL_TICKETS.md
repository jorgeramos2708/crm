# Technical Tickets — CRM Competitive Roadmap

Generated from Senior Tester Audit. Each ticket includes: **AC (Acceptance Criteria)**, **API Contract**, **DB Changes**, **UI Components**, **Effort**, **Dependencies**.

---

## 🟢 P0 — Foundation (Sprints 1-2)

---

### TKT-001: Field-Level Permissions (Security)

**Priority**: P0 | **Effort**: 3 SP | **Owner**: Backend + Frontend

#### Context

Enterprise requires hiding sensitive fields (`importe`, `probabilidad`, `custom.pii`, `stripe_*`) per role. Current permissions are module-level only.

#### DB Changes

```sql
-- New table
CREATE TABLE field_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role VARCHAR(20) NOT NULL, -- 'admin', 'manager', 'user', 'viewer'
  entity VARCHAR(50) NOT NULL, -- 'oportunidades', 'contactos', 'users', etc.
  field VARCHAR(100) NOT NULL, -- 'importe', 'custom.ssn', 'email'
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  UNIQUE (tenant_id, role, entity, field)
);
```

#### API Contract

```typescript
// GET /api/field-permissions?entity=oportunidades
// Response: { fieldPermissions: { importe: { read: true, write: false }, ... } }

// PUT /api/field-permissions (admin only)
// Body: { role: 'user', entity: 'oportunidades', field: 'importe', can_read: true, can_write: false }
```

#### Backend Tasks

- [ ] `FieldPermissionService` with cache (Redis, TTL 5min, invalidation on update)
- [ ] Middleware `fieldFilter(req, entity, data)` → strips forbidden fields from response
- [ ] Integration in `registerAuthRoutes` → applies to all GET/POST/PUT responses
- [ ] Unit tests: 15+ cases (role × entity × field × read/write)

#### Frontend Tasks

- [ ] `useFieldPermissions(entity)` hook → returns `{ canRead(field), canWrite(field) }`
- [ ] `<FieldWrapper field="importe" entity="oportunidades">` component → renders `****` or `<input disabled>` if no permission
- [ ] Admin UI: `/settings/permissions/fields` — matrix table (roles × fields) with toggles
- [ ] TypeScript: augment `Oportunidad` type with `__fieldPermissions__` brand

#### Acceptance Criteria

- [ ] User with `role: 'user'` cannot see `importe` in `/api/oportunidades` list or detail
- [ ] Same user gets 403 on `PUT /api/oportunidades/:id { importe: 1000 }`
- [ ] Admin can configure per-role per-field in UI, changes reflect in <5s (cache invalidation)
- [ ] No performance regression: <5ms overhead per request (benchmark)

---

### TKT-002: Bulk Actions Across All List Views

**Priority**: P0 | **Effort**: 2 SP | **Owner**: Frontend

#### Context

Users need to select multiple rows and apply: delete, assign, change stage, add to sequence, add to list, export.

#### API Contract

```typescript
// POST /api/oportunidades/bulk
// Body: { ids: string[], action: 'delete' | 'assign' | 'change_stage' | 'add_to_sequence', payload: {} }
// Response: { succeeded: string[], failed: { id, error }[] }

// Same pattern for: /api/contactos/bulk, /api/tareas/bulk, /api/email-campaigns/bulk
```

#### Frontend Tasks

- [ ] `useBulkActions(entity, apiEndpoint)` composable
- [ ] `<DataTableBulkToolbar>` component: shows when `selection.length > 0`
  - Dropdown with dynamic actions per entity (config-driven)
  - Loading state per action, toast summary on completion
- [ ] Selection: header checkbox (select all on page), shift+click range, persist across pagination
- [ ] Integrate in: `Oportunidades.vue`, `Contactos.vue`, `Tareas.vue`, `Campanas.vue`, `EmailTemplates.vue`

#### Acceptance Criteria

- [ ] Select 50 opportunities → "Change Stage" → "Negotiation" → all 50 updated, single toast "50 actualizadas"
- [ ] Partial failure: 48 succeed, 2 fail (e.g., deleted by another user) → toast "48 OK, 2 fallaron" + detail modal
- [ ] Keyboard: `Cmd+A` select all, `Shift+Click` range, `Escape` clear selection
- [ ] Works with 10k rows (virtualized selection state)

---

### TKT-003: Command Palette (Cmd+K)

**Priority**: P0 | **Effort**: 2 SP | **Owner**: Frontend

#### Context

Power users navigate via keyboard. Need global search + actions.

#### Frontend Tasks

- [ ] `CommandPalette.vue` (portal to body, `<Teleport>`)
  - Trigger: `Cmd+K` / `Ctrl+K` (global listener)
  - Fuse.js fuzzy search over: routes, entities, actions, recent items
  - Sections: "Navegar", "Crear", "Acciones recientes", "Configuración"
  - Keyboard nav: ↑↓, Enter, Esc
- [ ] Registry: `useCommandRegistry()` → plugins register commands
  ```ts
  registerCommand({
    id: "new-oportunidad",
    label: "Nueva Oportunidad",
    icon: "Plus",
    shortcut: "N",
    action: () => router.push("/oportunidades/nuevo"),
    when: () => hasPerm("oportunidades", "write"),
  });
  ```
- [ ] Recent items: persist last 10 visited entity details in `localStorage`

#### Acceptance Criteria

- [ ] Opens in <100ms, first result focused
- [ ] "Nueva Oportunidad" → opens modal/form
- [ ] "Cambiar a modo oscuro" → toggles theme
- [ ] Accessible: ARIA labels, screen reader announces results count

---

### TKT-004: Dark Mode + CSS Variables (Design System)

**Priority**: P0 | **Effort**: 2 SP | **Owner**: Frontend (Design System)

#### Context

Current theme toggle only swaps Tailwind `dark:` classes. Need proper CSS variable system for runtime switching, brand customization, and component library consistency.

#### Tasks

- [ ] `src/styles/theme.css` — CSS custom properties:
  ```css
  :root {
    --color-bg: #ffffff;
    --color-bg-secondary: #f8fafc;
    --color-text: #0f172a;
    --color-text-muted: #64748b;
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --color-border: #e2e8f0;
    --color-focus: #3b82f6;
    --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
    --radius: 0.5rem;
  }
  [data-theme="dark"] {
    --color-bg: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-text: #f8fafc;
    --color-text-muted: #94a3b8;
    --color-primary: #3b82f6;
    --color-border: #334155;
  }
  ```
- [ ] Migrate all components: replace Tailwind `bg-white`, `text-gray-900` → `bg-[var(--color-bg)]`, `text-[var(--color-text)]`
- [ ] `ThemeProvider` Vue plugin: reads `localStorage.theme` or `prefers-color-scheme`, applies `[data-theme]` on `<html>`
- [ ] Brand customization: admin can set `--color-primary` via `/api/ajustes/marca` → injects `<style>` tag

#### Acceptance Criteria

- [ ] Toggle in header → instant switch, no flash
- [ ] All 54 design-system tests pass in both themes
- [ ] Custom brand color persists across sessions
- [ ] Works in SSR (no hydration mismatch)

---

### TKT-005: Undo/Toast System

**Priority**: P0 | **Effort**: 1 SP | **Owner**: Frontend

#### Context

No undo for destructive actions; toasts inconsistent.

#### Tasks

- [ ] `useToast()` composable: `toast.success(msg, { undo: { label: 'Deshacer', onClick: () => undoFn() } })`
- [ ] `useUndoStack()` — stores last 5 reversible actions (delete, bulk update, stage change)
- [ ] Global `<ToastContainer>` (top-right, stack, auto-dismiss 5s, pause on hover)
- [ ] Integrate in: delete modals, bulk actions, stage drag-drop

#### Acceptance Criteria

- [ ] Delete opportunity → toast "Oportunidad eliminada · Deshacer" → click restores in <1s
- [ ] Bulk delete 10 → single toast with undo restores all 10
- [ ] Toast stack max 3, oldest dismisses
- [ ] Accessible: `role="alert"`, `aria-live="polite"`

---

## 🟡 P1 — Revenue Visibility (Sprints 3-4)

---

### TKT-006: Dashboard Builder — Funnel / Velocity / Forecast

**Priority**: P1 | **Effort**: 8 SP | **Owner**: Fullstack

#### Context

VPs need: funnel conversion rates by stage, sales velocity (days per stage), weighted forecast, rep leaderboards, cohort retention.

#### DB Changes

```sql
-- Materialized views refreshed hourly via pg_cron
CREATE MATERIALIZED VIEW mv_funnel_metrics AS
SELECT
  tenant_id,
  pipeline_id,
  stage_id,
  COUNT(*) FILTER (WHERE entered_at >= now() - interval '30 days') AS entered_30d,
  COUNT(*) FILTER (WHERE exited_at >= now() - interval '30 days') AS exited_30d,
  AVG(exited_at - entered_at) AS avg_days_in_stage
FROM stage_transitions
GROUP BY tenant_id, pipeline_id, stage_id;

CREATE MATERIALIZED VIEW mv_velocity AS
SELECT
  tenant_id,
  user_id AS rep_id,
  DATE_TRUNC('week', closed_at) AS week,
  COUNT(*) AS deals_closed,
  SUM(importe) AS revenue,
  AVG(closed_at - created_at) AS avg_cycle_days
FROM oportunidades
WHERE estado_cierre = 'ganado'
GROUP BY tenant_id, user_id, week;

CREATE MATERIALIZED VIEW mv_forecast AS
SELECT
  tenant_id,
  user_id AS rep_id,
  DATE_TRUNC('month', fecha_cierre_estimada) AS month,
  SUM(importe * probabilidad / 100) AS weighted_pipeline
FROM oportunidades
WHERE estado_cierre = 'abierto'
GROUP BY tenant_id, user_id, month;
```

#### API Contract

```typescript
// GET /api/reportes/funnel?pipelineId=&period=30d
// GET /api/reportes/velocity?period=12w
// GET /api/reportes/forecast?period=6m
// GET /api/reportes/rep-performance?period=4w
```

#### Backend Tasks

- [ ] `ReportesService` with caching (Redis, 1hr TTL)
- [ ] `pg_cron` job: `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_*` every hour
- [ ] Export: PDF (pdfkit), Excel (exceljs), CSV

#### Frontend Tasks

- [ ] `<DashboardBuilder>` — drag-drop widgets (gridstack.js)
- [ ] Widgets: `FunnelChart` (Recharts), `VelocityTrend`, `ForecastTable`, `RepLeaderboard`, `CohortRetention`
- [ ] Date range picker (presets: 7d, 30d, 90d, custom)
- [ ] Save/load dashboard layouts per user (`vistas_guardadas`)

#### Acceptance Criteria

- [ ] Funnel shows: Stage | Entered | Exited | Conversion % | Avg Days
- [ ] Velocity: line chart (weekly revenue + deals), table with rep breakdown
- [ ] Forecast: weighted pipeline by month/rep, confidence intervals
- [ ] Load time <2s for 10k deals (materialized view)
- [ ] Export PDF matches on-screen charts

---

### TKT-007: Scheduled Reports (Email/PDF)

**Priority**: P1 | **Effort**: 3 SP | **Owner**: Backend

#### Context

"Email me the weekly pipeline every Monday 8am."

#### DB Changes

```sql
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  report_type VARCHAR(50), -- 'funnel', 'velocity', 'forecast', 'custom'
  config JSONB, -- { pipelineId, period, format: 'pdf'|'excel' }
  cron VARCHAR(100), -- '0 8 * * 1' (Mon 8am)
  timezone VARCHAR(50) DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ;
```

#### Backend Tasks

- [ ] `ReportScheduler` — BullMQ job `report-schedule` with cron support (use `cron-parser`)
- [ ] Render report → generate PDF/Excel → attach to email → send via `sendEmail`
- [ ] Admin UI: `/settings/reports/scheduled` — CRUD + test send
- [ ] Audit log entry on each send

#### Acceptance Criteria

- [ ] Schedule created → runs at correct time in user's timezone
- [ ] Email received with PDF attachment, subject "Weekly Pipeline - 2024-01-15"
- [ ] Failure → retry 3x (exponential backoff), then alert admin via webhook
- [ ] DST handled correctly (IANA timezone)

---

### TKT-008: Email Builder Visual (MJML/React)

**Priority**: P1 | **Effort**: 5 SP | **Owner**: Frontend

#### Context

Current: raw HTML textarea. Need: drag-drop blocks, live preview, responsive, MJML export.

#### Tech Stack

- `mjml-react` + `react-mjml-preview` (run in `<iframe>` sandbox)
- Blocks: Text, Image, Button, Divider, Spacer, Columns, HTML, Product, RSS
- Output: MJML → HTML (for send) + MJML source (for edit)

#### Frontend Tasks

- [ ] `EmailBuilder.vue` — split pane: canvas (iframe) + sidebar (blocks + properties)
- [ ] Block registry: `registerEmailBlock('button', ButtonBlock)`
- [ ] Properties panel per block: style (color, padding, font), content, link, conditions
- [ ] Live sync: canvas updates on property change (<100ms)
- [ ] Save: stores `{ mjml: string, html: string, blocks: Block[] }` in `email_templates.contenido_mjml`
- [ ] Import existing HTML → best-effort MJML parse (grapesjs/mjml parser)

#### API Contract

```typescript
// POST /api/email-templates { nombre, asunto, contenido_mjml, contenido_html, variables }
// PUT /api/email-templates/:id { contenido_mjml, contenido_html }
```

#### Acceptance Criteria

- [ ] Build 3-column hero + CTA button + footer in <2min
- [ ] Preview renders correctly in Gmail/Outlook/Apple Mail (Litmus test)
- [ ] Responsive: mobile stacks columns, desktop side-by-side
- [ ] Variables `{{nombre}}`, `{{empresa}}` render in preview with sample data
- [ ] Exported HTML passes `mjml` validation (no warnings)

---

### TKT-009: Meeting Scheduler Embed

**Priority**: P1 | **Effort**: 4 SP | **Owner**: Fullstack

#### Context

Calendly-like: rep shares link → prospect picks slot → event created in Google/Outlook + CRM activity.

#### DB Changes

```sql
CREATE TABLE meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id), -- null = team round-robin
  nombre VARCHAR(100),
  duracion_min INT DEFAULT 30,
  buffer_antes_min INT DEFAULT 5,
  buffer_despues_min INT DEFAULT 5,
  dias_antelacion_min INT DEFAULT 1,
  dias_antelacion_max INT DEFAULT 60,
  zona_horaria VARCHAR(50) DEFAULT 'UTC',
  preguntas JSONB, -- [{ label, type: 'text'|'select', required }]
  activo BOOLEAN DEFAULT true
);

CREATE TABLE meeting_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type_id UUID REFERENCES meeting_types(id),
  inicio TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ NOT NULL,
  reservado_por UUID REFERENCES users(id), -- null = available
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Backend Tasks

- [ ] `MeetingSchedulerService`:
  - `generateSlots(typeId, rangeStart, rangeEnd)` → creates `meeting_slots` from user's calendar (Google/Outlook free/busy)
  - `bookSlot(slotId, guestInfo)` → creates calendar event (Graph/Google API), creates CRM activity, sends confirmation emails
- [ ] Public API (no auth): `GET /api/public/meeting-types/:slug/slots?from=&to=`, `POST /api/public/meeting-types/:slug/book`
- [ ] Webhook: calendar push notifications → update `meeting_slots` (cancelled/rescheduled)

#### Frontend Tasks

- [ ] `<MeetingSchedulerEmbed typeId="uuid" />` — iframe-ready component
  - Month view → day slots → time picker → form → confirmation
  - Timezone auto-detect (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
  - White-label: custom CSS variables, logo, colors
- [ ] Admin UI: `/settings/meeting-types` — CRUD, preview, copy embed code
- [ ] Rep view: `/mis-reuniones` — upcoming, history, no-shows

#### Acceptance Criteria

- [ ] Prospect books 30min slot → Google Calendar event created for rep + prospect
- [ ] Confirmation email sent to both with `.ics` attachment
- [ ] Rep sees activity in CRM timeline
- [ ] Cancel from calendar → slot freed, notification sent
- [ ] Round-robin: team link distributes evenly (weighted by availability)

---

## 🔵 P2 — Intelligence & Ecosystem (Sprints 5-8)

---

### TKT-010: PWA Offline + Push (IndexedDB + Background Sync)

**Priority**: P2 | **Effort**: 13 SP | **Owner**: Frontend (PWA Specialist)

#### Context

Field reps need: offline read/write, background sync when online, push notifications for assigned tasks/emails.

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Service Worker (Workbox)                                   │
│  ├── Precache: app shell (HTML, JS, CSS, fonts)             │
│   └── Runtime: API GET responses (stale-while-revalidate)   │
├─────────────────────────────────────────────────────────────┤
│  IndexedDB (idb)                                            │
│  ├── /offline/mutations — queue of failed POST/PUT/DELETE   │
│   ├── /offline/entities — cached GET responses (contacts,   │
│   │   opportunities, tasks) with timestamps                 │
│   └── /offline/outbox — pending emails, activities          │
├─────────────────────────────────────────────────────────────┤
│  Background Sync                                            │
│  ├── 'sync-mutations' — replay queue on connectivity        │
│   └── 'push-notification' — show notification from server   │
└─────────────────────────────────────────────────────────────┘
```

#### Tasks

- [ ] `vite-plugin-pwa` config: `workbox: { runtimeCaching, navigationPreload: true }`
- [ ] `offlineDb.ts` — idb schema + helpers (`queueMutation`, `getCached`, `replayQueue`)
- [ ] `useOffline()` composable: `isOnline`, `pendingCount`, `forceSync()`
- [ ] UI: offline banner ("Estás sin conexión · 3 cambios pendientes"), sync button
- [ ] Push: `web-push` (VAPID) → server sends payload → SW shows notification → click focuses app
- [ ] Server: `POST /api/push/subscribe` (stores `PushSubscription`), `POST /api/push/send` (batch)
- [ ] VAPID keys in env, rotation strategy

#### Acceptance Criteria

- [ ] Load app offline → shows cached contacts/opportunities
- [ ] Create opportunity offline → queued → syncs automatically when online
- [ ] Conflict resolution: server wins, local changes rebased (last-write-wins with toast)
- [ ] Push: task assigned → notification appears on mobile/desktop → click opens detail
- [ ] Lighthouse PWA score ≥ 90

---

### TKT-011: Lead Scoring Rules Engine

**Priority**: P2 | **Effort**: 5 SP | **Owner**: Backend

#### Context

Rules-based scoring (no ML yet): `score = Σ(weight × condition)`. Runs on contact create/update, email open/click, stage change.

#### DB Changes

```sql
CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  nombre VARCHAR(100),
  entidad VARCHAR(20), -- 'contacto', 'oportunidad'
  activo BOOLEAN DEFAULT true,
  reglas JSONB NOT NULL, -- [{ field, operator, value, weight }]
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contactos ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;
ALTER TABLE contactos ADD COLUMN IF NOT EXISTS lead_score_updated_at TIMESTAMPTZ;
```

#### Backend Tasks

- [ ] `LeadScoringEngine` — evaluates rules against entity + context (recent activities)
- [ ] Triggers: `contacto.updated`, `email.open`, `email.click`, `oportunidad.stage_changed`
- [ ] BullMQ job `lead-score-recalc` — debounced (5min), processes batch
- [ ] Admin UI: `/settings/lead-scoring` — visual rule builder (JSON editor + preview)

#### Acceptance Criteria

- [ ] Rule: "email opened 3× in 7d → +15 points" → score updates within 5min
- [ ] Score displayed in contact list/badge, sortable
- [ ] Audit trail: `lead_score_changed` activity with breakdown
- [ ] Performance: 10k contacts rescored in <30s

---

### TKT-012: Zapier/Make Integration App

**Priority**: P2 | **Effort**: 8 SP | **Owner**: Backend (Platform)

#### Context

Public integration listed on Zapier/Make marketplaces. Triggers + Actions.

#### Scope (MVP)

| Type        | Key                  | Description               |
| ----------- | -------------------- | ------------------------- |
| **Trigger** | `new_contact`        | Contact created           |
| **Trigger** | `new_oportunidad`    | Opportunity created       |
| **Trigger** | `stage_changed`      | Opportunity stage changed |
| **Trigger** | `email_opened`       | Email tracking open       |
| **Action**  | `create_contact`     | Create contact            |
| **Action**  | `create_oportunidad` | Create opportunity        |
| **Action**  | `update_stage`       | Change opportunity stage  |
| **Action**  | `send_email`         | Send tracked email        |
| **Action**  | `find_contact`       | Search contact by email   |

#### Backend Tasks

- [ ] Zapier CLI app (`zapier-platform-core`)
  - Auth: API Key (Bearer) + OAuth2 (PKCE) for user-level
  - Hydration: `id → full object` for dynamic dropdowns
  - Pagination: cursor-based for triggers
- [ ] Make (Integromat) app — same endpoints, different manifest
- [ ] Webhook registration: `POST /api/webhooks` with `eventos: ['zapier.*']`
- [ ] Docs: `zapier.com/apps/crm/integrations`, `make.com/en/integrations/crm`

#### Acceptance Criteria

- [ ] Zapier: "New Contact" trigger fires test → sample data received
- [ ] Zapier: "Create Opportunity" action → creates in CRM, returns ID
- [ ] OAuth2 flow works: user connects → Zapier stores tokens → refreshes automatically
- [ ] Listed on Zapier Public (invite-only beta) + Make Marketplace

---

## 🟣 P3 — Enterprise Readiness (Sprints 9-12)

---

### TKT-013: Sandbox Promotion CLI

**Priority**: P3 | **Effort**: 5 SP | **Owner**: DevOps + Backend

#### Context

Customers need: dev → staging → prod promotion of config (pipelines, fields, automations, templates) without data.

#### Tasks

- [ ] `pnpm sandbox:export --env=staging --output=./sandbox.json`
  - Exports: pipelines, stages, custom_fields, email_templates, automatizaciones, meeting_types, lead_scoring_rules
  - Excludes: contacts, opportunities, activities, emails, tracking
- [ ] `pnpm sandbox:import --env=prod --input=./sandbox.json --dry-run`
  - Diff report: creates/updates/deletes
  - `--force` to apply
- [ ] CI/CD: GitHub Action `sandbox-promote.yml` — manual trigger, requires approval
- [ ] Audit log: `sandbox_promoted` with diff summary

#### Acceptance Criteria

- [ ] Export → import in clean DB → identical config (verified by `contracts.lock.test`)
- [ ] Dry-run shows accurate diff
- [ ] Rollback: `sandbox:import --previous` restores prior state

---

### TKT-014: SSO SAML/OIDC + SCIM Provisioning

**Priority**: P3 | **Effort**: 8 SP | **Owner**: Backend (Auth Specialist)

#### Context

Enterprise requirement: Okta, Azure AD, Google Workspace SSO + automated user provisioning/deprovisioning.

#### DB Changes

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50); -- 'saml', 'oidc', 'google', 'microsoft'
ALTER TABLE users ADD COLUMN IF NOT EXISTS sso_subject VARCHAR(255); -- NameID / sub
ALTER TABLE users ADD COLUMN IF NOT EXISTS sso_attributes JSONB; -- groups, roles, department
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sso_config JSONB; -- { provider, entityId, ssoUrl, cert, attributeMap }
```

#### Backend Tasks

- [ ] SAML 2.0 SP: `@node-saml/passport-saml` → ACS endpoint `/api/auth/saml/callback`
- [ ] OIDC: `openid-client` → `/api/auth/oidc/callback`
- [ ] JIT Provisioning: on first SSO login → create user, map attributes → assign role from SAML groups/OIDC claims
- [ ] SCIM 2.0 Server: `GET/POST/PUT/PATCH/DELETE /api/scim/v2/Users` + `/Groups`
  - Bearer token auth (separate SCIM token per tenant)
  - Filters: `userName eq "john@corp.com"`
  - Provisioning: Okta/Azure push → create/update/deactivate user in CRM
- [ ] Admin UI: `/settings/sso` — configure SAML/OIDC, test connection, download metadata XML

#### Acceptance Criteria

- [ ] Okta SAML: user clicks app tile → redirected to CRM → logged in, role mapped from `groups` claim
- [ ] Azure AD SCIM: create user in Azure → appears in CRM in <10s, assigned to correct team
- [ ] Deactivate in IdP → user `activo: false` in CRM, sessions revoked
- [ ] Supports multiple IdPs per tenant (e.g., Google for employees, SAML for partners)

---

## 📋 Cross-Cutting Concerns

| Concern               | Implementation                                                                     |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Feature Flags**     | `unleash-server` (self-hosted) → `useFeatureFlag('email-builder-v2')`              |
| **Observability**     | OpenTelemetry → Tempo (traces), Loki (logs), Mimir (metrics)                       |
| **API Versioning**    | Header `Accept: application/vnd.crm.v2+json` → routing via Fastify `acceptVersion` |
| **Rate Limiting**     | Per-tenant token bucket (Redis), configurable per plan                             |
| **Data Retention**    | `audit_log` partitioned by month, TTL 7 years; `email_tracking` 2 years            |
| **Disaster Recovery** | Daily PG dump to S3 (MinIO), point-in-time recovery tested quarterly               |

---

## 📦 Definition of Done (Per Ticket)

- [ ] TypeScript strict: `pnpm build` passes
- [ ] Tests: unit ≥ 80% coverage, integration ≥ 1 happy path
- [ ] Contract test: `contracts.lock.test` passes (routes + schema)
- [ ] Accessibility: axe-core 0 violations (WCAG 2.1 AA)
- [ ] Performance: Lighthouse ≥ 90, API p95 < 200ms
- [ ] Documentation: OpenAPI updated, CHANGELOG entry, migration guide if breaking
- [ ] Deploy: staging verified, feature flag off by default, rollback plan documented

---

## 🚀 Quick Start for Next Sprint

```bash
# 1. Pick top 3 P0 tickets
# 2. Create GitHub issues from this file (copy AC + API + DB)
# 3. Assign owners, estimate in planning poker
# 4. Sprint goal: "Foundation: field perms + bulk actions + cmd palette + dark mode + undo"
```

> **Tip**: Use `gh issue create --title "TKT-001: Field-Level Permissions" --body-file <(sed -n '/^### TKT-001/,/^### TKT-/p' TECHNICAL_TICKETS.md | head -n -1)`
