<!-- src/components/profile/PasswordForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="password-form">
    <div class="form-group">
      <label for="oldPassword">旧密码</label>
      <input type="password" id="oldPassword" v-model="form.oldPassword" class="form-input" required
        placeholder="输入当前密码" />
    </div>

    <div class="form-group">
      <label for="newPassword">新密码</label>
      <input type="password" id="newPassword" v-model="form.newPassword" class="form-input" required placeholder="输入新密码"
        minlength="8" />
      <small class="form-hint">密码长度至少8位，建议包含字母、数字和特殊字符</small>
    </div>

    <div class="form-group">
      <label for="confirmPassword">确认新密码</label>
      <input type="password" id="confirmPassword" v-model="form.confirmPassword" class="form-input" required
        placeholder="再次输入新密码" />
      <small v-if="passwordMismatch" class="form-error">两次输入的密码不一致</small>
    </div>

    <div class="form-actions">
      <button type="button" class="cancel-btn" @click="$emit('cancel')">
        取消
      </button>
      <PrimaryButton type="submit" :fullWidth="false" :disabled="isSubmitting || passwordMismatch">
        {{ isSubmitting ? "提交中..." : "确认修改" }}
      </PrimaryButton>
    </div>
  </form>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"

export default {
  name: "PasswordForm",
  components: {
    PrimaryButton,
  },
  data() {
    return {
      form: {
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      },
      isSubmitting: false
    }
  },
  computed: {
    passwordMismatch() {
      return this.form.newPassword &&
        this.form.confirmPassword &&
        this.form.newPassword !== this.form.confirmPassword
    }
  },
  methods: {
    async handleSubmit() {
      if (this.passwordMismatch) {
        return
      }

      this.isSubmitting = true

      try {
        // 发送表单数据给父组件
        this.$emit("submit", {
          oldPassword: this.form.oldPassword,
          newPassword: this.form.newPassword
        })

        // 清空表单
        this.resetForm()
      } catch (error) {
        console.error("密码修改表单提交失败:", error)
      } finally {
        this.isSubmitting = false
      }
    },

    resetForm() {
      this.form = {
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      }
    }
  }
}
</script>

<style scoped>
.password-form {
  width: 100%;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.2);
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 12px;
  color: #777;
}

.form-error {
  display: block;
  margin-top: 0.5rem;
  font-size: 12px;
  color: #e74c3c;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  color: #555;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}
</style>