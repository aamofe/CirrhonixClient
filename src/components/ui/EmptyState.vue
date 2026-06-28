<template>
  <div class="empty-state">
    <p v-if="message">{{ message }}</p>
    <slot />
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    message: { type: String, default: '' },
  },
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-light);
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-md);
}

.empty-state p {
  margin: 0 0 1rem;
  font-size: 14px;
}

.empty-action {
  margin-top: 0.5rem;
}
</style>
