<template>
  <button
    class="btn-primary"
    :class="{ 'full-width': fullWidth, [`size-${size}`]: true }"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="btn-spinner" />
    <span>
      <slot>{{ loading ? '处理中...' : '按钮' }}</slot>
    </span>
    <slot name="icon" />
  </button>
</template>

<script>
export default {
  name: 'PrimaryButton',
  inheritAttrs: false,
  props: {
    loading: { type: Boolean, default: false },
    fullWidth: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    size: {
      type: String,
      default: 'default',
      validator: (v) => ['default', 'small'].includes(v),
    },
  },
}
</script>

<style scoped>
.btn-primary {
  background: var(--gradient-button);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
  font-weight: 500;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.btn-primary.size-small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-primary.full-width {
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
