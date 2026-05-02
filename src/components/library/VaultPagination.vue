<script setup lang="ts">
/**
 * Vault Pagination
 * 
 * Modularizes the pagination navigation for the Vault.
 */
defineProps<{
  currentPage: number
  totalPages: number
  visiblePages: number[]
  mini?: boolean
}>()

const emit = defineEmits(['prev', 'next', 'update:page'])
</script>

<template>
  <div class="pagination-controls" :class="{ mini, 'glass-xs': mini, 'glass-sm': !mini }">
    <div class="page-info muted">
      Page <strong>{{ currentPage }}</strong> <span v-if="!mini">of</span><span v-else>/</span> {{ totalPages }}
    </div>
    
    <div class="page-nav">
      <button class="nav-btn" :class="{ 'btn-xs': mini }" :disabled="currentPage === 1" @click="emit('prev')">
        ← <span v-if="!mini">Previous</span>
      </button>
      
      <div v-if="!mini" class="page-numbers">
        <button 
          v-for="p in visiblePages" 
          :key="p" 
          class="page-num" 
          :class="{ active: p === currentPage }"
          @click="emit('update:page', p)"
        >
          {{ p }}
        </button>
      </div>

      <button class="nav-btn" :class="{ 'btn-xs': mini }" :disabled="currentPage === totalPages" @click="emit('next')">
        <span v-if="!mini">Next</span> →
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  margin-top: var(--space-6);
  background: rgba(255, 255, 255, 0.03);
}

.pagination-controls.mini {
  margin-top: 0;
  margin-bottom: var(--space-4);
  padding: var(--space-2) var(--space-4);
  justify-content: flex-end;
  gap: var(--space-4);
}

.pagination-controls.mini .page-info { font-size: 0.75rem; }
.btn-xs { padding: 4px 10px; font-size: 0.7rem; }

.page-nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.page-numbers { display: flex; gap: var(--space-2); }

.page-num {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.85rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}

.page-num:hover { background: rgba(255, 255, 255, 0.1); color: white; }
.page-num.active { background: var(--accent); color: white; border-color: var(--accent); box-shadow: 0 0 12px rgba(139, 92, 246, 0.3); }

.nav-btn {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.8rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); border-color: var(--accent); }
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.page-info { font-size: 0.85rem; }
.page-info strong { color: var(--accent-bright); }
</style>
