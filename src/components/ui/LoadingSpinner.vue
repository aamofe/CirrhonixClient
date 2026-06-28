<template>
  <div :class="['loading-spinner', size, { inline }]">
    <div class="spinner" />
    <span v-if="text">{{ text }}</span>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    text: { type: String, default: '加载中...' },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v),
    },
    inline: { type: Boolean, default: false },
  },
}
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.loading-spinner.inline {
  flex-direction: row;
  padding: 1.5rem;
  gap: 10px;
}

.spinner {
  border-radius: 50%;
  border-style: solid;
  border-color: rgba(26, 145, 193, 0.3);
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
}

.loading-spinner.sm .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loading-spinner.md .spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
  margin-bottom: 12px;
}

.loading-spinner.lg .spinner {
  width: 40px;
  height: 40px;
  border-width: 3px;
  margin-bottom: 15px;
}

.loading-spinner.inline .spinner {
  margin-bottom: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
