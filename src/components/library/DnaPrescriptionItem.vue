<script setup lang="ts">
/**
 * DNA Prescription Item
 * 
 * A specialized item for the "Clinic" section that provides a recommendation 
 * based on the user's behavioral DNA.
 */
defineProps<{
  rx: {
    id: string | number
    title: string
    desc: string
    icon: string
    link?: string
    linkText?: string
    severity: 'critical' | 'warning' | 'good' | 'info'
  }
}>()
</script>

<template>
  <div class="rx-item-dna" :class="rx.severity">
    <span class="rx-icon-lg">{{ rx.icon }}</span>
    <div class="rx-content">
      <h5>{{ rx.title }}</h5>
      <p class="muted-sm">{{ rx.desc }}</p>
      <router-link v-if="rx.link" :to="rx.link" class="rx-link">
        {{ rx.linkText || 'Learn More' }}
      </router-link>
    </div>
    <div class="rx-severity-dot"></div>
  </div>
</template>

<style scoped>
.rx-item-dna {
  display: flex;
  gap: var(--space-5);
  padding: var(--space-6);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  position: relative;
  transition: all 0.3s ease;
}

.rx-item-dna:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.rx-icon-lg { 
  font-size: 2.5rem; 
  flex-shrink: 0; 
}

.rx-content h5 { 
  margin: 0 0 4px 0; 
  font-size: 1.1rem; 
  font-weight: 800; 
}

.muted-sm { 
  font-size: 0.85rem; 
  color: var(--text-secondary); 
  line-height: 1.5; 
}

.rx-link { 
  display: inline-block; 
  margin-top: 12px; 
  font-size: 0.85rem; 
  font-weight: 700; 
  color: var(--accent-bright); 
  text-decoration: none; 
}

.rx-severity-dot {
  position: absolute; 
  top: 20px; 
  right: 20px; 
  width: 10px; 
  height: 10px; 
  border-radius: 50%;
}

/* Severity Styling */
.rx-item-dna.critical .rx-severity-dot { 
  background: var(--rose); 
  box-shadow: 0 0 10px var(--rose); 
}

.rx-item-dna.warning .rx-severity-dot { 
  background: var(--gold); 
}

.rx-item-dna.good .rx-severity-dot { 
  background: var(--green); 
}

.rx-item-dna.info .rx-severity-dot { 
  background: var(--accent-bright); 
}
</style>
