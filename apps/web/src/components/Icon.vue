<!-- Icon (Fase 1): envoltorio del set Lucide (@lucide/vue).
  Uso: <Icon name="contactos" class="h-5 w-5" />
  `path` permite reutilizar paths inline legacy (ex: StatCard) sin cambiar su API.
  Los iconos son decorativos junto a etiquetas de texto → aria-hidden. -->
<template>
  <svg
    v-if="path"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="path" />
  </svg>
  <component
    v-else
    :is="icon"
    :size="size"
    :stroke-width="strokeWidth"
    aria-hidden="true"
  />
</template>

<script setup>
import { computed } from "vue";
import {
  House,
  Handshake,
  Users,
  Building,
  SquareKanban,
  Briefcase,
  FileText,
  Package,
  Megaphone,
  Inbox,
  Target,
  LayoutTemplate,
  ListChecks,
  CalendarDays,
  Calendar,
  ListTodo,
  Activity,
  TrendingUp,
  ChartColumn,
  Zap,
  Settings,
  SquarePen,
  ShieldCheck,
} from "@lucide/vue";

const props = defineProps({
  name: { type: String, default: "resumen" },
  path: { type: String, default: "" },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 2 },
});

const icons = {
  resumen: House,
  ventas: Handshake,
  contactos: Users,
  empresas: Building,
  pipeline: SquareKanban,
  negocios: Briefcase,
  presupuestos: FileText,
  productos: Package,
  marketing: Megaphone,
  correos: Inbox,
  campanas: Target,
  plantillas: LayoutTemplate,
  listas: ListChecks,
  agenda: CalendarDays,
  calendario: Calendar,
  tareas: ListTodo,
  actividades: Activity,
  operaciones: TrendingUp,
  automatizaciones: Zap,
  reportes: ChartColumn,
  ajustes: Settings,
  redactar: SquarePen,
  admin: ShieldCheck,
  usuarios: Users,
  equipo: Users,
};

const icon = computed(() => icons[props.name] || House);
</script>
