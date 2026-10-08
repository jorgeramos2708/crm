<template>
  <div class="date-range-picker" :class="{ 'date-range-picker--open': isOpen }">
    <button
      type="button"
      class="date-range-picker__trigger"
      @click="toggle"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      aria-label="Seleccionar rango de fechas"
    >
      <svg class="date-range-picker__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span class="date-range-picker__label">
        {{ formatRange }}
      </span>
      <svg class="date-range-picker__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <Teleport to="body" v-if="isOpen">
      <div class="date-range-picker__overlay" @click="close"></div>
      <div class="date-range-picker__panel" role="dialog" aria-modal="true" aria-label="Seleccionar rango de fechas">
        <div class="date-range-picker__header">
          <h3>Seleccionar rango de fechas</h3>
          <button class="date-range-picker__close" @click="close" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="date-range-picker__presets">
          <button
            v-for="preset in presets"
            :key="preset.key"
            type="button"
            class="date-range-picker__preset"
            :class="{ 'date-range-picker__preset--active': activePreset === preset.key }"
            @click="selectPreset(preset)"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="date-range-picker__calendars">
          <div class="date-range-picker__calendar">
            <div class="calendar-header">
              <button type="button" class="calendar-nav" @click="prevMonth(startMonth)" aria-label="Mes anterior">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <span class="calendar-title">{{ formatMonthYear(startMonth) }}</span>
              <button type="button" class="calendar-nav" @click="nextMonth(startMonth)" aria-label="Mes siguiente">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
            <div class="calendar-grid">
              <div class="calendar-weekdays">
                <span v-for="d in weekdays" :key="d">{{ d }}</span>
              </div>
              <div class="calendar-days">
                <button
                  v-for="day in startCalendarDays"
                  :key="day.date"
                  type="button"
                  class="calendar-day"
                  :class="{
                    'calendar-day--today': day.isToday,
                    'calendar-day--selected': isDateSelected(day.date, 'start'),
                    'calendar-day--in-range': isDateInRange(day.date),
                    'calendar-day--start': isDateSelected(day.date, 'start'),
                    'calendar-day--end': isDateSelected(day.date, 'end'),
                    'calendar-day--disabled': day.isDisabled,
                  }"
                  @click="selectDate(day.date, 'start')"
                  :disabled="day.isDisabled"
                  :aria-label="day.label"
                  :aria-selected="isDateSelected(day.date, 'start')"
                >
                  {{ day.day }}
                </button>
              </div>
            </div>
          </div>

          <div class="date-range-picker__calendar">
            <div class="calendar-header">
              <button type="button" class="calendar-nav" @click="prevMonth(endMonth)" aria-label="Mes anterior">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <span class="calendar-title">{{ formatMonthYear(endMonth) }}</span>
              <button type="button" class="calendar-nav" @click="nextMonth(endMonth)" aria-label="Mes siguiente">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
            <div class="calendar-grid">
              <div class="calendar-weekdays">
                <span v-for="d in weekdays" :key="d">{{ d }}</span>
              </div>
              <div class="calendar-days">
                <button
                  v-for="day in endCalendarDays"
                  :key="day.date"
                  type="button"
                  class="calendar-day"
                  :class="{
                    'calendar-day--today': day.isToday,
                    'calendar-day--selected': isDateSelected(day.date, 'end'),
                    'calendar-day--in-range': isDateInRange(day.date),
                    'calendar-day--start': isDateSelected(day.date, 'start'),
                    'calendar-day--end': isDateSelected(day.date, 'end'),
                    'calendar-day--disabled': day.isDisabled,
                  }"
                  @click="selectDate(day.date, 'end')"
                  :disabled="day.isDisabled"
                  :aria-label="day.label"
                  :aria-selected="isDateSelected(day.date, 'end')"
                >
                  {{ day.day }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="date-range-picker__footer">
          <div class="date-range-picker__summary">
            <span v-if="range.start && range.end">
              {{ formatDate(range.start) }} - {{ formatDate(range.end) }}
            </span>
            <span v-else-if="range.start">
              Desde {{ formatDate(range.start) }}
            </span>
            <span v-else>
              Sin selección
            </span>
          </div>
          <div class="date-range-picker__actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="clear">Limpiar</button>
            <button type="button" class="btn btn-primary btn-sm" @click="apply" :disabled="!range.start || !range.end">Aplicar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { Teleport } from "vue";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  isDisabled: boolean;
  label: string;
}

const props = defineProps<{
  modelValue: { start: Date | null; end: Date | null };
  maxDate?: Date;
  minDate?: Date;
  presets?: Array<{ key: string; label: string; start: Date; end: Date }>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: { start: Date | null; end: Date | null }];
}>();

const range = ref<{ start: Date | null; end: Date | null }>({
  start: props.modelValue.start ? new Date(props.modelValue.start) : null,
  end: props.modelValue.end ? new Date(props.modelValue.end) : null,
});

const isOpen = ref(false);
const activePreset = ref<string | null>(null);
const startMonth = ref(new Date());
const endMonth = ref(new Date());

const presets = computed(() => [
  { key: "today", label: "Hoy", start: new Date(), end: new Date() },
  { key: "yesterday", label: "Ayer", start: yesterday(), end: yesterday() },
  { key: "7d", label: "Últimos 7 días", start: daysAgo(7), end: new Date() },
  { key: "30d", label: "Últimos 30 días", start: daysAgo(30), end: new Date() },
  { key: "90d", label: "Últimos 90 días", start: daysAgo(90), end: new Date() },
  { key: "thisMonth", label: "Este mes", start: startOfMonth(), end: endOfMonth() },
  { key: "lastMonth", label: "Mes pasado", start: startOfLastMonth(), end: endOfLastMonth() },
  ...(props.presets || []),
]);

const weekdays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const startCalendarDays = computed(() => generateCalendarDays(startMonth.value, true));
const endCalendarDays = computed(() => generateCalendarDays(endMonth.value, false));

const toggle = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    syncMonths();
    document.addEventListener("keydown", handleKeydown);
    document.body.style.overflow = "hidden";
  } else {
    document.removeEventListener("keydown", handleKeydown);
    document.body.style.overflow = "";
  }
};

const close = () => {
  isOpen.value = false;
  document.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
};

const apply = () => {
  if (range.value.start && range.value.end) {
    emit("update:modelValue", { ...range.value });
    close();
  }
};

const clear = () => {
  range.value = { start: null, end: null };
  activePreset.value = null;
  emit("update:modelValue", { start: null, end: null });
};

const selectPreset = (preset: { key: string; start: Date; end: Date }) => {
  range.value = { start: preset.start, end: preset.end };
  activePreset.value = preset.key;
  syncMonths();
};

const selectDate = (date: Date, type: "start" | "end") => {
  if (type === "start") {
    range.value.start = date;
    if (range.value.end && date > range.value.end) {
      range.value.end = date;
    }
  } else {
    range.value.end = date;
    if (range.value.start && date < range.value.start) {
      range.value.start = date;
    }
  }
  activePreset.value = null;
  syncMonths();
};

const isDateSelected = (date: Date, type: "start" | "end") => {
  const target = range.value[type];
  return target && sameDay(date, target);
};

const isDateInRange = (date: Date) => {
  if (!range.value.start || !range.value.end) return false;
  return date > range.value.start && date < range.value.end;
};

const syncMonths = () => {
  if (range.value.start) startMonth.value = new Date(range.value.start.getFullYear(), range.value.start.getMonth(), 1);
  if (range.value.end) endMonth.value = new Date(range.value.end.getFullYear(), range.value.end.getMonth(), 1);
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") close();
};

const prevMonth = (monthRef: { value: Date }) => {
  monthRef.value = new Date(monthRef.value.getFullYear(), monthRef.value.getMonth() - 1, 1);
};

const nextMonth = (monthRef: { value: Date }) => {
  monthRef.value = new Date(monthRef.value.getFullYear(), monthRef.value.getMonth() + 1, 1);
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatRange = computed(() => {
  if (range.value.start && range.value.end) {
    return `${formatShort(range.value.start)} - ${formatShort(range.value.end)}`;
  }
  if (range.value.start) return `Desde ${formatShort(range.value.start)}`;
  return "Seleccionar rango";
});

const formatShort = (date: Date) => date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });

const generateCalendarDays = (month: Date, isStart: boolean): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, monthIndex, -i);
    days.push(createDay(date, false));
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, monthIndex, d);
    days.push(createDay(date, sameDay(date, new Date())));
  }

  // Next month days to fill grid
  const totalCells = Math.ceil((firstDayOfWeek + lastDay.getDate()) / 7) * 7;
  const remaining = totalCells - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, monthIndex + 1, d);
    days.push(createDay(date, false));
  }

  return days;

  function createDay(date: Date, isToday: boolean): CalendarDay {
    const isBeforeMin = props.minDate && date < props.minDate!;
    const isAfterMax = props.maxDate && date > props.maxDate!;
    const isDisabled = isBeforeMin || isAfterMax;

    return {
      date: new Date(date),
      day: date.getDate(),
      isToday,
      isDisabled,
      label: date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    };
  }
};

const sameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfLastMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfLastMonth = () => {
  const d = new Date();
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

onMounted(() => {
  syncMonths();
});

watch(() => props.modelValue, (newVal) => {
  range.value = {
    start: newVal.start ? new Date(newVal.start) : null,
    end: newVal.end ? new Date(newVal.end) : null,
  };
  syncMonths();
});
</script>

<style scoped>
.date-range-picker {
  position: relative;
  display: inline-block;
}

.date-range-picker__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--crm-fg, #1c1917);
  background: var(--crm-bg-secondary, #f8fafc);
  border: 1px solid var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius, 0.5rem);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.date-range-picker__trigger:hover {
  border-color: var(--crm-primary, #2563eb);
  background: var(--crm-bg, #fff);
}

.date-range-picker__trigger:focus-visible {
  outline: 2px solid var(--crm-primary, #2563eb);
  outline-offset: 2px;
}

.date-range-picker__icon,
.date-range-picker__chevron {
  width: 18px;
  height: 18px;
  color: var(--crm-text-muted, #64748b);
  flex-shrink: 0;
}

.date-range-picker__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.date-range-picker__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 999;
  animation: fadeIn 0.15s ease-out;
}

.date-range-picker__panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 720px;
  max-height: 90vh;
  background: var(--crm-bg, #fff);
  border: 1px solid var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius-lg, 0.75rem);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

.date-range-picker__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.date-range-picker__header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--crm-fg, #1c1917);
}

.date-range-picker__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--crm-muted-fg, #64748b);
  background: transparent;
  border: none;
  border-radius: var(--crm-radius, 0.5rem);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.date-range-picker__close:hover {
  color: var(--crm-fg, #1c1917);
  background: var(--crm-muted, #f4f2ed);
}

.date-range-picker__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.date-range-picker__preset {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--crm-text-muted, #64748b);
  background: var(--crm-bg-secondary, #f8fafc);
  border: 1px solid var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius, 0.5rem);
  cursor: pointer;
  transition: all 0.15s;
}

.date-range-picker__preset:hover {
  color: var(--crm-fg, #1c1917);
  border-color: var(--crm-primary, #2563eb);
}

.date-range-picker__preset--active {
  color: var(--crm-brand-fg, #fff);
  background: var(--crm-brand, #2563eb);
  border-color: var(--crm-brand, #2563eb);
}

.date-range-picker__calendars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.calendar-nav {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--crm-muted-fg, #64748b);
  background: transparent;
  border: none;
  border-radius: var(--crm-radius, 0.5rem);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.calendar-nav:hover {
  color: var(--crm-fg, #1c1917);
  background: var(--crm-muted, #f4f2ed);
}

.calendar-title {
  font-weight: 600;
  color: var(--crm-fg, #1c1917);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--crm-muted-fg, #64748b);
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
  margin-bottom: 0.25rem;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: var(--crm-fg, #1c1917);
  background: transparent;
  border: none;
  border-radius: var(--crm-radius, 0.5rem);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.calendar-day:hover:not(:disabled) {
  background: var(--crm-muted, #f4f2ed);
}

.calendar-day--today {
  font-weight: 600;
  color: var(--crm-brand, #2563eb);
}

.calendar-day--selected {
  background: var(--crm-brand, #2563eb);
  color: var(--crm-brand-fg, #fff);
  font-weight: 600;
}

.calendar-day--in-range {
  background: color-mix(in srgb, var(--crm-brand, #2563eb) 15%, transparent);
}

.calendar-day--start,
.calendar-day--end {
  background: var(--crm-brand, #2563eb);
  color: var(--crm-brand-fg, #fff);
  font-weight: 600;
}

.calendar-day--disabled {
  color: var(--crm-muted-fg, #94a3b8);
  cursor: not-allowed;
}

.calendar-day--disabled:hover {
  background: transparent;
  cursor: not-allowed;
}

.date-range-picker__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--crm-border, #e2e8f0);
  background: var(--crm-bg-secondary, #f8fafc);
}

.date-range-picker__summary {
  font-size: 0.875rem;
  color: var(--crm-text-muted, #64748b);
}

.date-range-picker__actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--crm-radius, 0.5rem);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: var(--crm-brand, #2563eb);
  color: var(--crm-brand-fg, #fff);
  border-color: var(--crm-brand, #2563eb);
}

.btn-primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--crm-brand, #2563eb) 90%, black);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: var(--crm-fg, #1c1917);
  border-color: var(--crm-border, #e2e8f0);
}

.btn-ghost:hover {
  background: var(--crm-muted, #f4f2ed);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .date-range-picker__overlay,
  .date-range-picker__panel {
    animation: none;
  }
}
</style>