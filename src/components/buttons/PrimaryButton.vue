<!-- src/components/PrimaryButton.vue -->
<template>
  <button :type="type" class="btn-primary" :class="{ 'full-width': fullWidth }" @click="$emit('click', $event)">
    <span>
      <slot>按钮</slot>
    </span>
    <slot name="icon"></slot>
  </button>
</template>

<script>
export default {
  name: "PrimaryButton",
  props: {
    type: {
      type: String,
      default: "button",
    },
    fullWidth: {
      type: Boolean,
      default: true,
    },
  },
}
</script>

<style scoped>
.btn-primary {
  background: linear-gradient(to right, #a8e6cf, #1a91c1);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.full-width {
  width: 100%;
}

.btn-primary:hover {
  background: linear-gradient(to right, #97d0bb, #1578a2);
  box-shadow: 0 4px 12px rgba(26, 145, 193, 0.3);
}

.btn-primary span {
  position: relative;
  z-index: 1;
}
</style>
