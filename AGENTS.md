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

3. **Anchos actuales (NO CAMBIAR):**
   - Negocios: `["35%", "15%", "15%", "15%", "10%", "10%"]` — 6 col
   - Contactos: `["20%", "20%", "15%", "20%", "15%", "10%"]` — 6 col
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

**Ejecutar siempre:** `npm test` (debe ser 85/85)

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

# Deploy Docker
cd apps/web && docker rm -f crm-web && docker build -f Dockerfile.vue -t crm-web . && docker run -d --name crm-web --network crm-network -p 8081:80 crm-web
```
