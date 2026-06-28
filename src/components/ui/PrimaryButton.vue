<template>
  <button
    class="btn"
    :class="[`btn-${variant}`, { 'full-width': fullWidth, [`size-${size}`]: true }]"
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
    variant: {
      type: String,
      default: 'primary',
      validator: (v) => ['primary', 'secondary', 'danger'].includes(v),
    },
  },
}
</script>

<style scoped>
.btn {
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s, background-color 0.2s, border-color 0.2s;
  font-weight: 500;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--gradient-button);
  color: white;
  border: none;
}

.btn-secondary {
  background-color: transparent;
  border-color: #ddd;
  color: #555;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.btn-danger {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background-color: rgba(231, 76, 60, 0.2);
  border-color: rgba(231, 76, 60, 0.5);
}

.btn.size-small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn.full-width {
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn:disabled {
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
</style>
