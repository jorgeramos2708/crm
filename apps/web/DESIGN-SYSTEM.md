# Sistema de diseño (apps/web)

Vue 3 + Tailwind 3. Tokens en `src/style.css` (`:root` / `html.dark`, prefijo
`--crm-*`) mapeados 1:1 a `tailwind.config.js` (rampa alabastro). La marca del
despliegue se aplica con `body.tema-marca` + `var(--marca)`.

## Componentes (`src/components/`)

| Componente                          | Uso                                                                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Btn`                               | `variant`: primary, secondary, outline, ghost, link, link-danger, danger. `size`: sm, md, lg. `to` (router-link), `href` + `target`, `loading`, `disabled`. |
| `Icon`                              | Set Lucide (`name`) + modo legacy por `path` (StatCard). Decorativos: `aria-hidden`.                                                                        |
| `Badge`                             | `variant`: dot (hereda color de texto), pill, chip. `color` o `hex` arbitrario. `pulse`, `dot`, `dotSize`.                                                  |
| `Card`                              | `flat` (`.panel-flat`, resumen) / `elevated` (blanca + borde + sombra). Padding por clase.                                                                  |
| `Table` + `Th`/`Td`                 | Slots `#head`/default. `Td`: `primary`, `tone` (muted/strong), `align`, `compact` (`Th` también).                                                           |
| `Field`                             | Etiqueta que **envuelve** al control (asociación implícita a11y) + `error`/`hint`.                                                                          |
| `Input`                             | `v-model`, `type`, `multiline`/`rows`. Ancho por clase (`w-full`, `flex-1`).                                                                                |
| `Select`                            | `v-model`, `size` sm/md, opciones por slot.                                                                                                                 |
| `Modal`                             | `open`, `title` o slot `#title`, slot `#actions`, `maxWidth`, `contentClass`, `z`. Cierra con `@close`.                                                     |
| `Pagination`                        | `page`, `totalPages`, `total`, `pageSize`, `itemLabel`. Emite `prev`/`next`. Slot `controls`.                                                               |
| `EmptyState`                        | `icon` (nombre Icon) + `compact`. Slot mensaje + slot `action` (CTA). Estados vacíos en tablas/listas.                                                      |
| `Modal`                             | Reka UI Dialog: foco atrapado, Escape, scroll-lock y `aria`. Misma API visual (`open`, `title`/`#title`, `#actions`).                                       |
| `Sheet`                             | Reka UI Dialog lateral. `open`, `side` (left/right), `width`, `title`/`#header`, `#footer`. `@close`.                                                       |
| `CommandPalette`                    | Paleta ⌘K/Ctrl+K. `open`, `commands` (`id`,`label`,`group?`,`icon?`,`to?`,`run?`). Emite `close`/`select`. ↑↓ + Enter.                                      |
| `DropdownMenu` + `DropdownMenuItem` | Reka UI DropdownMenu. `#trigger`, items con `@select`; `danger`/`disabled`.                                                                                 |
| `Tooltip`                           | Reka UI Tooltip + Portal. `content`, `side`, `sideOffset`, `delay`. Requiere `TooltipProvider` (App).                                                       |
| `GraficaBarras`                     | Barras SVG FOSS. `datos` (`etiqueta`,`valor`,`valorFmt?`,`extra?`,`corto?`), `color`, `animar`. Empty state + grid.                                         |
| `GraficaDona`                       | Dona SVG FOSS. `datos` (`etiqueta`,`count`,`color`), `centro`, `animar`. Leyenda con %, empty state.                                                        |
| `GraficaLinea`                      | Serie temporal SVG FOSS. `datos` (`etiqueta`,`valor`,`valorFmt?`), `color`, `mostrarEtiquetas`. Área + línea.                                               |

## Convenciones

- Clases Tailwind idénticas a los patrones originales; los componentes no inventan estilos.
- `v-model.number`, checkboxes, `file`/`color`, toggles personalizados y tablas de
  impresión quedan nativos a propósito.
- Iconos Lucide vía `@lucide/vue`; nombres centralizados en `Icon.vue`.
- `v-auto-animate` (`@formkit/auto-animate`) para FLIP de listas/kanban; respeta
  `prefers-reduced-motion` vía el directivo en `main.js`.
- ⌘K/Ctrl+K abre la paleta (`App.vue` → `CommandPalette`); atajo global en
  `window.keydown`.
- Drag & drop (Pipeline/Tareas): highlight de columna destino
  (`dropTarget` + ring), card origen atenuada (`opacity-40`), `dataTransfer`
  con `effectAllowed=move`.
- Tests: `design-system.test.ts` (componentes) + `views/Dashboard.test.ts`.
- Formato con Prettier antes de cada commit (`lint-staged` lo exige; usar
  `git commit --no-verify` solo si los hooks fallan por causas ajenas).
