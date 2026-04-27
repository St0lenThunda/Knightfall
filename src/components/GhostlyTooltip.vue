<template>
  <div class="ghostly-tooltip-wrap" @mouseenter="show = true" @mouseleave="show = false">
    <slot></slot>
    <Transition name="tooltip-fade">
      <div v-if="show" class="ghostly-tooltip glass-heavy">
        <div class="tooltip-arrow"></div>
        <div class="tooltip-content">
          <p>{{ text }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ text: string }>()
const show = ref(false)
</script>

<style scoped>
.ghostly-tooltip-wrap {
  position: relative;
  display: inline-block;
}

.ghostly-tooltip {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  padding: 12px 16px;
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  pointer-events: none;
}

.tooltip-content {
  font-size: 0.75rem;
  color: white;
  line-height: 1.4;
  font-weight: 500;
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(10, 10, 20, 0.95);
}

.tooltip-fade-enter-active, .tooltip-fade-leave-active {
  transition: all 0.2s ease;
}
.tooltip-fade-enter-from, .tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
