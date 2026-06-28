<!-- src/components/BaseInput.vue -->
<template>
  <div class="form-group">
    <label :for="id">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <el-input
      :id="id"
      :model-value="modelValue"
      :type="type === 'password' ? 'password' : type"
      :placeholder="placeholder"
      :show-password="type === 'password'"
      clearable
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script>
export default {
  name: 'FormInput',
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, default: 'text' },
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
}
</script>
