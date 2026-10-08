<!-- EmptyState (Premium): estado vacío ilustrado con acción opcional
  Props: icon, title, description, compact, action slot -->
<template>
  <div class="empty-state" :class="{ 'empty-compact': compact }">
    <div class="empty-illustration">
      <component :is="iconComponent" :class="iconSize" :stroke-width="1.5" />
    </div>
    <div class="empty-content">
      <h3 v-if="title" class="empty-title">{{ title }}</h3>
      <p v-if="description" class="empty-description">{{ description }}</p>
      <slot name="description" />
    </div>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  Inbox, Users, Briefcase, Mail, Calendar, CheckSquare,
  Activity, BarChart2, Zap, FileText, Send, LayoutTemplate,
  List, Building2, Package, GitBranch, Settings, Search,
  Filter, Funnel, DollarSign, TrendingUp, Clock, AlertCircle,
} from "@lucide/vue";

const props = defineProps({
  icon: {
    type: String,
    default: "inbox",
    validator: (v) => [
      "inbox", "users", "briefcase", "mail", "calendar", "check-square",
      "activity", "bar-chart", "zap", "file-text", "send", "layout-template",
      "list", "building", "package", "git-branch", "settings", "search",
      "filter", "funnel", "dollar-sign", "trending-up", "clock", "alert-circle",
    ].includes(v),
  },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  compact: { type: Boolean, default: false },
});

const iconMap = {
  inbox: Inbox,
  users: Users,
  briefcase: Briefcase,
  mail: Mail,
  calendar: Calendar,
  "check-square": CheckSquare,
  activity: Activity,
  "bar-chart": BarChart2,
  zap: Zap,
  "file-text": FileText,
  send: Send,
  "layout-template": LayoutTemplate,
  list: List,
  building: Building2,
  package: Package,
  "git-branch": GitBranch,
  settings: Settings,
  search: Search,
  filter: Filter,
  funnel: Funnel,
  "dollar-sign": DollarSign,
  "trending-up": TrendingUp,
  clock: Clock,
  "alert-circle": AlertCircle,
};

const iconComponent = computed(() => iconMap[props.icon] || Inbox);

const iconSize = computed(() => {
  if (props.compact) return "h-10 w-10 text-[var(--fg-subtle)]";
  return "h-16 w-16 text-[var(--fg-subtle)] opacity-60";
});
</script>

<style scoped>
.empty-state {
  @apply flex flex-col items-center justify-center text-center py-12 px-4;
}

.empty-compact {
  @apply py-6 px-3;
}

.empty-illustration {
  @apply mb-4 flex items-center justify-center;
  color: var(--fg-subtle);
}

.empty-content {
  @apply max-w-sm;
}

.empty-title {
  @apply text-lg font-semibold text-[var(--fg)] mb-1;
}

.empty-compact .empty-title {
  @apply text-base;
}

.empty-description {
  @apply text-sm text-[var(--fg-muted)] leading-relaxed;
}

.empty-compact .empty-description {
  @apply text-xs;
}

.empty-action {
  @apply mt-6 w-full max-w-sm;
}

.empty-compact .empty-action {
  @apply mt-4;
}

/* Animation */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (prefers-reduced-motion: no-preference) {
  .empty-illustration svg {
    animation: float 3s ease-in-out infinite;
  }
}
</style>