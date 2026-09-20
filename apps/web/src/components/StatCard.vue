<template>
  <div class="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5">
    <div class="flex items-center justify-between">
      <span class="text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{{ title }}</span>
      <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg" :class="chip">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="icon" /></svg>
      </span>
    </div>
    <div class="mt-2 text-[28px] leading-9 font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{{ value }}</div>
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
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
}
const chip = chips[props.color] || chips.zinc
</script>
