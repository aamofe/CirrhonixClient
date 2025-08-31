<!-- src/components/ui/CancelButton.vue -->
<template>
  <button class="cancel-button" :class="{ 'full-width': fullWidth }" @click="$emit('click')">
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: "CancelButton",
  props: {
    fullWidth: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["click"],
}
</script>

<style scoped>
.cancel-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: #f1f1f1;
  border-color: #ccc;
}

.cancel-button:active {
  background-color: #e8e8e8;
}

.full-width {
  width: 100%;
}
</style>
