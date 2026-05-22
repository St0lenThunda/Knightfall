<template>
  <div class="progress-bar" :class="{ gradient }">
    <div class="fill" :style="{ width: `${pct}%`, background: barColor }" />
  </div>
</template>

<script setup lang="ts">
/**
 * Generic progress bar component.
 * @param pct - Percentage between 0 and 100.
 * @param gradient - If true use a gradient background for the fill.
 */
interface Props {
  pct: number
  gradient?: boolean
}
const props = defineProps<Props>()

const barColor = computed(() => (props.gradient ? 'var(--accent-gradient)' : 'var(--accent)'))
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 99px;
  overflow: hidden;
  background: var(--bg-elevated);
}
.progress-bar.gradient {
  background: rgba(255,255,255,0.05);
}
.fill {
  height: 100%;
  transition: width 0.4s ease;
}
</style>
