<!-- src/components/FormInput.vue -->
<template>
  <div class="input-group">
    <label :for="id">{{ label }}</label>
    <div v-if="type === 'password'" class="password-input">
      <input :id="id" :type="showPassword ? 'text' : 'password'" :value="modelValue" :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)" :required="required" />
      <span class="password-toggle" @click="togglePassword">
        {{ showPassword ? "隐藏" : "显示" }}
      </span>
    </div>
    <input v-else :id="id" :type="type" :value="modelValue" :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)" :required="required" />
  </div>
</template>

<script>
export default {
  name: "FormInput",
  props: {
    id: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "text",
    },
    modelValue: {

      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      showPassword: false,
    }
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword
    },
  },
}
</script>

<style scoped>
.input-group {
  margin-bottom: 20px;
  position: relative;
}

.input-group label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
}

.input-group input:focus {
  outline: none;
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.3);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #1a91c1;
  cursor: pointer;
  user-select: none;
}
</style>
