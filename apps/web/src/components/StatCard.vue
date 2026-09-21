<template>
  <div class="metric-float">
    <div class="flex items-center gap-2">
      <span class="inline-flex h-6 w-6 items-center justify-center rounded-lg" :class="chip">
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="icon" /></svg>
      </span>
      <span class="text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{{ title }}</span>
    </div>
    <div class="mt-1 text-[30px] leading-10 font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{{ value }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: '—' },
  icon: { type: String, default: 'M4 6h16M4 12h16M4 18h16' },
  color: { type: String, default: 'zinc' },
})

const chips = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
  zinc: 'bg-zinc-200/70 text-zinc-600 dark:bg-white/10 dark:text-zinc-300',
}
const chip = chips[props.color] || chips.zinc
</script>
