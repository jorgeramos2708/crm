# Sistema de diseño (apps/web)

Vue 3 + Tailwind 3. Tokens en `src/style.css` (`:root` / `html.dark`, prefijo
`--crm-*`) mapeados 1:1 a `tailwind.config.js` (rampa alabastro). La marca del
despliegue se aplica con `body.tema-marca` + `var(--marca)`.

## Componentes (`src/components/`)

| Componente | Uso |
| --- | --- |
| `Btn` | `variant`: primary, secondary, outline, ghost, link, link-danger, danger. `size`: sm, md, lg. `to` (router-link), `href` + `target`, `loading`, `disabled`. |
| `Icon` | Set Lucide (`name`) + modo legacy por `path` (StatCard). Decorativos: `aria-hidden`. |
| `Badge` | `variant`: dot (hereda color de texto), pill, chip. `color` o `hex` arbitrario. `pulse`, `dot`, `dotSize`. |
| `Card` | `flat` (`.panel-flat`, resumen) / `elevated` (blanca + borde + sombra). Padding por clase. |
| `Table` + `Th`/`Td` | Slots `#head`/default. `Td`: `primary`, `tone` (muted/strong), `align`, `compact` (`Th` también). |
| `Field` | Etiqueta que **envuelve** al control (asociación implícita a11y) + `error`/`hint`. |
| `Input` | `v-model`, `type`, `multiline`/`rows`. Ancho por clase (`w-full`, `flex-1`). |
| `Select` | `v-model`, `size` sm/md, opciones por slot. |
| `Modal` | `open`, `title` o slot `#title`, slot `#actions`, `maxWidth`, `contentClass`, `z`. Cierra con `@close`. |
| `Pagination` | `page`, `totalPages`, `total`, `pageSize`, `itemLabel`. Emite `prev`/`next`. Slot `controls`. |

## Convenciones

- Clases Tailwind idénticas a los patrones originales; los componentes no inventan estilos.
- `v-model.number`, checkboxes, `file`/`color`, toggles personalizados y tablas de
  impresión quedan nativos a propósito.
- Iconos Lucide vía `@lucide/vue`; nombres centralizados en `Icon.vue`.
- Tests: `design-system.test.ts` (componentes) + `views/Dashboard.test.ts`.
- Formato con Prettier antes de cada commit (`lint-staged` lo exige; usar
  `git commit --no-verify` solo si los hooks fallan por causas ajenas).
