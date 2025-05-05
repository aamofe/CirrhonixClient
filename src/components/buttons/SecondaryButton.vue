<!-- src/components/buttons/SecondaryButton.vue -->
<template>
  <button
    class="secondary-button"
    :class="{ 'full-width': fullWidth }"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: "SecondaryButton",
  props: {
    fullWidth: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["click"],
};
</script>

<style scoped>
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: #f0f7ff;
  color: #1976d2;
  border: 1px solid #c8e1ff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-button:hover {
  background-color: #e1f0ff;
  border-color: #a9d1fd;
}

.secondary-button:active {
  background-color: #d3e8ff;
}

.full-width {
  width: 100%;
}
</style>
