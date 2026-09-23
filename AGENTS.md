# AGENTS.md — Reglas bloqueadas del CRM

## ⚠️ NO MODIFICAR sin justificación explícita del usuario

Estos elementos están blindados con tests (`npm test`). Cualquier cambio debe pasar la suite completa.

---

### Tablas — alineación de columnas (CRÍTICO)

**Archivos:** `Negocios.vue`, `Contactos.vue`, `Productos.vue`, `Table.vue`, `Th.vue`, `Td.vue`

1. **`Table.vue`**:
   - Prop `cols` (array de anchos CSS) → activa `table-fixed` + `<colgroup>`.
   - **Nunca** envolver `TransitionGroup` en un `<tbody>` externo (bug de tbody anidado que rompe alineación).
   - `TransitionGroup tag="tbody"` debe ser hijo directo de `<table>`.
   - `table-fixed` SOLO cuando `cols` tiene elementos; sin `cols` → auto layout.

2. **Headers vacíos para acciones**: las columnas Editar/Eliminar/Acciones usan `<Th></Th>` vacío (sin `align`, sin texto visible). El ancho lo da el `colgroup`, no el contenido.

3. **Anchos actuales (NO CAMBIAR — verificados en `contracts.golden.json`):**
   - Negocios: `["30%", "20%", "15%", "15%", "10%", "10%"]` — 6 col
   - Contactos: `["18%", "18%", "13%", "18%", "15%", "18%"]` — 6 col
   - Productos: `["35%", "20%", "15%", "15%", "15%"]` — 5 col

4. **Headers visibles (exactos):**
   - Negocios: Negocio, Etapa, Importe (right), Probabilidad (right), _(vacío)_, _(vacío)_
   - Contactos: Nombre, Email, Teléfono, Empresa, Cargo, _(vacío)_
   - Productos: Producto, SKU, Precio (right), Estado, _(vacío)_

5. **NO** usar `PROB.` (usar `Probabilidad`), `ACCIONES`, `EDITAR`, `ELIMINAR` como headers visibles.

6. **Th**: `px-6 py-3`, `text-xs uppercase`, alineación left por defecto.
   **Td**: `px-6 py-4`, `text-sm`, alineación left por defecto.

---

### Tests de blindaje

- `src/components/table-alignment.test.ts` — comportamiento de Table/Th/Td
- `src/views/table-headers.lock.test.ts` — estructura fuente de las 3 vistas
- `apps/api/src/contracts.lock.test.ts` — 147 rutas API + 33 tablas + rutas Vue/nav/cols/compose (golden)
- `apps/api/src/services/email.test.ts` — tracking de email (pixel/click ids)

**Regenerar goldens SOLO a propósito** (cambio de contrato):

```bash
node scripts/extract-contracts.mjs
# revisar diff de apps/*/contracts.golden.json y commitear
```

**Ejecutar siempre:** `npm test` en `apps/web` y `apps/api`

**Fase 2 — BullMQ**: colas en `apps/api/src/services/queues.ts`
(`automatizaciones-action`, `email-campaign-send`, `tarea-vencimiento`).
Consumers en `worker.ts`. Delayed actions NO usan `setTimeout`.

**Fase 3 — Reportes + Metabase**:

- Endpoints: `/api/reportes/{embudo,mensual,actividad,vendedores,campanas,tareas}`
- Metabase (opcional): `docker compose --profile bi up -d metabase` → puerto 3002

---

### Otros blindajes previos

- **Btn primary**: `backgroundColor: var(--marca, #2563eb)` via `btnStyle`, NO clase `bg-zinc-900`.
- **Btn loading**: svg usa clase `animate-spin-fast` (no `animate-spin`).
- **Select disabled**: atributo va en el `<select>` interno, no en la raíz.
- **Modal close**: handler en overlay `@click.self`, no en la raíz.

---

### Comandos

```bash
# Tests (SIEMPRE antes de deploy)
cd apps/web && npm test

# Deploy — TODO bajo Compose (raíz del proyecto)
docker compose up -d --build

# Solo web (rebuild parcial)
docker compose up -d --build web

# Estado
docker compose ps

# Logs
docker compose logs -f api web

# ⛔ NO usar (deja huérfanos fuera de Compose, rompe DNS minio):
# docker rm -f crm-web && docker run ... --network crm-network
```

### Rollback pre-compose (2026-09-22)

- Git tag: `restore-pre-compose-20260922`
- Snapshot + script: `backups/restore-pre-compose-20260922/ROLLBACK.ps1`
- Imágenes respaldo: `restore-pre-compose-crm-{api,web,worker}`

### Reglas Docker

1. **Nunca** `docker run` manual para servicios CRM — siempre `docker compose`.
2. **Una sola red**: `crm_default` (la de Compose). No crear `crm-network`.
3. Los 6 servicios (postgres, redis, minio, api, worker, web) viven en el proyecto Compose `crm`.
