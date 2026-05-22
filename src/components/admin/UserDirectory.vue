<template>
  <div class="user-directory glass-xs">
    <div class="directory-header">
      <h4>ARCHIVIST_USER_DIRECTORY</h4>
      
      <!-- Search Input controls -->
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          class="search-input glass-input" 
          placeholder="Search by username or email..."
          @keyup.enter="handleSearch"
        />
        <button 
          class="btn btn-primary search-btn" 
          :disabled="adminStore.isFetchingUsers" 
          @click="handleSearch"
        >
          {{ adminStore.isFetchingUsers ? 'FETCHING...' : 'SEARCH' }}
        </button>
      </div>
    </div>

    <!-- User list result table -->
    <div class="directory-content">
      <div v-if="adminStore.isFetchingUsers" class="loading-state">
        <div class="spinner"></div>
        <span class="muted">Scanning public records...</span>
      </div>
      
      <div v-else-if="adminStore.users.length === 0" class="empty-state">
        <span class="icon">🔍</span>
        <span class="muted">No matching profiles found in database.</span>
      </div>

      <div v-else class="table-wrapper custom-scroll">
        <table class="user-table">
          <thead>
            <tr>
              <th>USERNAME</th>
              <th>EMAIL</th>
              <th>RATING</th>
              <th>XP</th>
              <th>HEARTS</th>
              <th>ROLE</th>
              <th>JOINED</th>
              <th class="actions-col">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in adminStore.users" :key="user.id">
              <td class="username-cell">
                <span class="name">{{ user.username || 'Ghost' }}</span>
                <span class="uuid">{{ user.id }}</span>
              </td>
              <td>{{ user.email || 'N/A' }}</td>
              <td class="num-cell">{{ user.rating || 1200 }}</td>
              <td class="num-cell">{{ user.xp || 0 }}</td>
              <td class="num-cell">❤️ {{ user.hearts ?? 5 }}</td>
              <td>
                <span 
                  class="role-pill" 
                  :class="user.role === 'admin' ? 'admin-pill' : 'user-pill'"
                >
                  {{ (user.role || 'user').toUpperCase() }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td class="actions-cell">
                <!-- Admins cannot purge other admins, nor themselves -->
                <button
                  v-if="user.role !== 'admin'"
                  class="btn-purge-action"
                  title="Purge user and associated games"
                  @click="$emit('purge-user', user)"
                >
                  PURGE
                </button>
                <span v-else class="muted-action">PROTECTED</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../../stores/adminStore'

/**
 * Emits Definition
 * 
 * @property select-user - Triggered when a user row is selected
 * @property purge-user - Triggered when the purge button for a user is clicked
 */
defineEmits<{
  (e: 'select-user', user: any): void
  (e: 'purge-user', user: any): void
}>()

const adminStore = useAdminStore()
const searchQuery = ref('')

// --- LIFECYCLE ---
onMounted(() => {
  // Prepopulate the directory on load
  adminStore.fetchUsers()
})

// --- METHODS ---
/**
 * Triggers the adminStore action to retrieve profiles based on the search query.
 */
function handleSearch() {
  adminStore.fetchUsers(searchQuery.value)
}

/**
 * Format timestamp into standard readable calendar format.
 * 
 * @param dateStr - The ISO timestamp string
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.user-directory {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(10, 10, 12, 0.6);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.directory-header {
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .directory-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

h4 {
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.25em;
  color: var(--accent);
  font-weight: 900;
}

.search-bar {
  display: flex;
  gap: var(--space-2);
  max-width: 420px;
  width: 100%;
}

.search-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.3s;
}
.search-input:focus {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
}

.search-btn {
  padding: 6px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.directory-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 300px;
}

.loading-state, .empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255,255,255,0.05);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state .icon {
  font-size: 1.8rem;
  opacity: 0.5;
}

.table-wrapper {
  height: 100%;
  overflow-y: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8rem;
}

.user-table th {
  position: sticky;
  top: 0;
  background: rgba(13, 13, 16, 0.95);
  padding: var(--space-3-5) var(--space-5);
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.1em;
  font-size: 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 10;
}

.user-table td {
  padding: var(--space-3-5) var(--space-5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  vertical-align: middle;
}

.user-table tr:hover td {
  background: rgba(255, 255, 255, 0.015);
}

.username-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username-cell .name {
  font-weight: 700;
  color: #fff;
}

.username-cell .uuid {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: -0.02em;
}

.num-cell {
  font-family: var(--font-mono);
}

.role-pill {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 4px;
}
.admin-pill {
  color: var(--accent-bright);
  background: rgba(167, 139, 250, 0.12);
  border: 1px solid rgba(167, 139, 250, 0.2);
}
.user-pill {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
}

.actions-col {
  text-align: right;
}

.actions-cell {
  text-align: right;
}

.btn-purge-action {
  background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.2);
  color: #f87171;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.7rem;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.2s;
}
.btn-purge-action:hover {
  background: rgba(244, 63, 94, 0.2);
  border-color: #fb7185;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.2);
}

.muted-action {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  opacity: 0.5;
}
</style>
