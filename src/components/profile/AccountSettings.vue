<!-- src/components/profile/AccountSettingsComponent.vue -->
<template>
  <div class="account-settings-component">
    <h3>账号设置</h3>
    <div class="settings-container">
      <div class="setting-group">
        <h4>通知设置</h4>
        <div class="setting-item">
          <label class="switch">
            <input type="checkbox" v-model="settings.emailNotifications" />
            <span class="slider"></span>
          </label>
          <div class="setting-text">
            <span>邮件通知</span>
            <small>接收有关新文献、收藏夹更新等邮件通知</small>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h4>安全设置</h4>
        <div class="setting-item">
          <PrimaryButton :fullWidth="false" @click="showChangePasswordModal = true">
            修改密码
          </PrimaryButton>
        </div>
      </div>

      <div class="setting-actions">
        <PrimaryButton @click="saveSettings">保存设置</PrimaryButton>
      </div>
    </div>

    <!-- 修改密码模态框 -->
    <ModalComponent v-if="showChangePasswordModal" title="修改密码" @close="showChangePasswordModal = false">
      <PasswordForm @submit="updatePassword" />
    </ModalComponent>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import ModalComponent from "@/components/common/ModalComponent.vue"
import PasswordForm from "@/components/form/PasswordForm.vue"
import User from "@/api/User"

export default {
  name: "AccountSettingsComponent",
  components: {
    PrimaryButton,
    ModalComponent,
    PasswordForm,
  },
  data() {
    return {
      showChangePasswordModal: false,
      settings: {
        emailNotifications: true,
      },
    }
  },
  methods: {
    async fetchSettings() {
      try {
        // 假设API会返回用户设置
        const response = await User.getSettings()
        if (response.data) {
          this.settings = response.data
        }
      } catch (error) {
        console.error("获取设置失败", error)
      }
    },

    async saveSettings() {
      try {
        await User.updateSettings(this.settings)
        this.$message.success("设置保存成功")
      } catch (error) {
        console.error("保存设置失败", error)
        this.$message.error("保存设置失败")
      }
    },

    async updatePassword(data) {
      try {
        await User.updatePassword(data)
        this.showChangePasswordModal = false
        this.$message.success("密码修改成功")
      } catch (error) {
        console.error("密码修改失败", error)
        this.$message.error("密码修改失败")
      }
    },
  },
  created() {
    this.fetchSettings()
  },
}
</script>

<style scoped>
.account-settings-component {
  width: 100%;
}

.setting-group {
  margin-bottom: 2rem;
}

.setting-group h4 {
  margin-bottom: 1rem;
  color: #555;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.setting-text {
  display: flex;
  flex-direction: column;
}

.setting-text small {
  color: #777;
  font-size: 13px;
  margin-top: 0.25rem;
}

.setting-actions {
  margin-top: 2rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: #1a91c1;
}

input:checked+.slider:before {
  transform: translateX(24px);
}
</style>
