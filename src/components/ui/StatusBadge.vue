<template>
  <span :class="['status-badge', statusClass]">{{ displayLabel }}</span>
</template>

<script>
import { getStatusText, getStatusClass } from '@/utils/format'

export default {
  name: 'StatusBadge',
  props: {
    status: { type: String, required: true },
    label: { type: String, default: '' },
  },
  computed: {
    statusClass() {
      return getStatusClass(this.status)
    },
    displayLabel() {
      return this.label || getStatusText(this.status)
    },
  },
}
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.running {
  background: #e8f4f8;
  color: var(--color-primary);
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.cancelled {
  background: #e2e3e5;
  color: #383d41;
}

.status-badge.queued {
  background: #e9ecef;
  color: #495057;
}
</style>
