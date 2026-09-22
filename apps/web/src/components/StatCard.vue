<template>
  <div class="metric-float" :class="{ 'stat-hover': !loading }" :style="{ transform: hover ? 'translateY(-2px)' : '' }">
    <div class="flex items-center gap-2">
      <span class="inline-flex h-6 w-6 items-center justify-center rounded-lg" :class="chip">
        <Icon :path="icon" class="h-3.5 w-3.5" :stroke-width="2.2" />
      </span>
      <span class="text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{{ title }}</span>
    </div>
    <div class="mt-1 text-[30px] leading-10 font-bold tabular-nums text-zinc-900 dark:text-zinc-50" :style="{ transition: 'transform 0.2s ease' }">
      <span v-if="loading" class="animate-pulse">—</span>
      <span v-else class="stat-value" :style="{ transform: `scale(${scale})` }">{{ displayValue }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: '—' },
  icon: { type: String, default: 'M4 6h16M4 12h16M4 18h16' },
  color: { type: String, default: 'zinc' },
  animate: { type: Boolean, default: true },
  duration: { type: Number, default: 800 },
})

const chips = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
  zinc: 'bg-zinc-200/70 text-zinc-600 dark:bg-white/10 dark:text-zinc-300',
}
const chip = chips[props.color] || chips.zinc

const displayValue = ref('')
const scale = ref(1)
const loading = ref(true)
const hover = ref(false)
let animationFrame = null
let startTime = null

const animateCount = () => {
  const target = typeof props.value === 'number' ? props.value : parseFloat(String(props.value).replace(/[^0-9.-]/g, '')) || 0
  const isCurrency = String(props.value).includes('$') || String(props.value).includes('€') || String(props.value).includes('£')
  const prefix = isCurrency ? '$' : ''
  const decimals = target % 1 !== 0 ? 2 : 0
  
  const animate = (currentTime) => {
    if (!startTime) startTime = currentTime
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
    const current = target * eased
    displayValue.value = prefix + current.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    
    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate)
    } else {
      displayValue.value = prefix + target.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      loading.value = false
    }
  }
  
  if (props.animate && target > 0) {
    loading.value = true
    startTime = null
    animationFrame = requestAnimationFrame(animate)
  } else {
    displayValue.value = String(props.value)
    loading.value = false
  }
}

const cleanup = () => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
}

onMounted(() => {
  watch(() => props.value, () => {
    cleanup()
    animateCount()
  }, { immediate: true })
})

onBeforeUnmount(cleanup)
</script>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .metric-float {
    transition: none !important;
  }
  .stat-value {
    transition: none !important;
  }
}

.metric-float {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-float:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.1);
}

.stat-value {
  display: inline-block;
  transition: transform 0.2s ease;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse-subtle 1.5s ease-in-out infinite;
}
</style>
