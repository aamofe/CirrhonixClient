<template>
  <div class="profile-page">
    <div class="container">
      <div class="section-title">
        <div class="title-content">
          <h2>个人信息</h2>
        </div>
      </div>
      <div class="profile-content">
        <div class="profile-sidebar">
          <nav>
            <div v-for="(item, index) in navItems" :key="index" @click="setActiveSection(item.id)"
              :class="['nav-item', activeSection === item.id ? 'active' : '']">
              <span class="nav-icon">
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
              </span>
              <span>{{ item.label }}</span>
            </div>
          </nav>
        </div>

        <div class="profile-main">
          <div v-if="activeSection === 'basic'" class="profile-section">
            <h3>基本信息</h3>
            <ProfileForm v-if="!loading" :user="userInfo" @profileUpdated="updateLocalUserInfo"
              @showPasswordModal="showChangePasswordModal = true" @logout="logout" />
            <div v-else class="loading">加载中...</div>
          </div>

          <div v-if="activeSection === 'collections'" class="profile-section">
            <CollectionsComponent />
          </div>

          <div v-if="activeSection === 'history'" class="profile-section">
            <ReadingHistoryComponent />
          </div>
        </div>
      </div>
    </div>

    <ModalComponent v-if="showChangePasswordModal" title="修改密码" @close="closePasswordModal">
      <form @submit.prevent="handlePasswordSubmit" class="password-form">
        <div class="form-group">
          <label for="oldPassword">旧密码</label>
          <input type="password" id="oldPassword" v-model="passwordForm.oldPassword" class="form-input" required
            placeholder="输入当前密码" />
        </div>

        <div class="form-group">
          <label for="newPassword">新密码</label>
          <input type="password" id="newPassword" v-model="passwordForm.newPassword" class="form-input" required
            placeholder="输入新密码" minlength="8" />
          <small class="form-hint">密码长度至少8位，建议包含字母、数字和特殊字符</small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认新密码</label>
          <input type="password" id="confirmPassword" v-model="passwordForm.confirmPassword" class="form-input" required
            placeholder="再次输入新密码" />
          <small v-if="passwordMismatch" class="form-error">两次输入的密码不一致</small>
        </div>

        <div class="form-actions">
          <CancelButton @click="closePasswordModal"> 取消 </CancelButton>
          <button type="submit" class="submit-btn" :disabled="isPasswordSubmitting || passwordMismatch">
            {{ isPasswordSubmitting ? "提交中..." : "确认修改" }}
          </button>
        </div>
      </form>
    </ModalComponent>
  </div>
</template>

<script>
import ModalComponent from "@/components/ui/BaseModal.vue"
import CancelButton from "@/components/ui/CancelButton.vue" // Import CancelButton
import User from "@/api/User"

import ProfileForm from "@/components/profile/ProfileForm.vue"
import CollectionsComponent from "@/components/profile/Collections.vue"
import ReadingHistoryComponent from "@/components/profile/ReadingHistory.vue"

import {
  User as UserIcon,
  Collection as BookmarkIcon,
  Clock as HistoryIcon,
  Search as SearchIcon,
} from "@element-plus/icons-vue"

export default {
  name: "ProfileView",
  components: {
    ProfileForm,
    CollectionsComponent,
    ReadingHistoryComponent,
    ModalComponent,
    CancelButton, // Register CancelButton
    UserIcon,
    BookmarkIcon,
    HistoryIcon,
    SearchIcon,
  },
  data() {
    return {
      activeSection: this.getSavedSection(),
      loading: true,
      userInfo: null,
      showChangePasswordModal: false,
      navItems: [
        { id: "basic", label: "基本信息", icon: "UserIcon" },
        { id: "collections", label: "我的收藏夹", icon: "BookmarkIcon" },
        { id: "history", label: "阅读历史", icon: "HistoryIcon" },
      ],
      // 密码表单相关数据
      passwordForm: {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
      isPasswordSubmitting: false,
    }
  },
  computed: {
    passwordMismatch() {
      return (
        this.passwordForm.newPassword &&
        this.passwordForm.confirmPassword &&
        this.passwordForm.newPassword !== this.passwordForm.confirmPassword
      )
    },
  },
  methods: {
    async fetchUserInfo() {
      this.loading = true
      try {
        const response = await User.profile()
        this.userInfo = response.data.data
      } catch (error) {
        // 错误处理
      } finally {
        this.loading = false
      }
    },

    updateLocalUserInfo(updatedUserInfo) {
      this.userInfo = updatedUserInfo
    },

    setActiveSection(sectionId) {
      this.activeSection = sectionId
      sessionStorage.setItem("profileActiveSection", sectionId)

      if (sectionId !== "collections" && this.$route.query.collectionId) {
        const query = { ...this.$route.query }
        delete query.collectionId
        this.$router.replace({ query })
      }
    },

    getSavedSection() {
      const savedSection = sessionStorage.getItem("profileActiveSection")
      return savedSection || "basic"
    },

    // 密码表单相关方法
    async handlePasswordSubmit() {
      if (this.passwordMismatch) {
        return
      }

      this.isPasswordSubmitting = true

      try {
        await User.updatePassword({
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword,
        })

        this.$message.success("密码修改成功")
        this.resetPasswordForm()
        this.closePasswordModal()
      } catch (error) {
        this.$message.error("密码修改失败，请检查旧密码是否正确")
      } finally {
        this.isPasswordSubmitting = false
      }
    },

    closePasswordModal() {
      this.showChangePasswordModal = false
      this.resetPasswordForm()
    },

    resetPasswordForm() {
      this.passwordForm = {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }
    },

    async logout() {
      try {
        await User.logout()
        this.$message.success("退出登录成功")

        localStorage.removeItem("token")
        sessionStorage.removeItem("profileActiveSection")

        this.$router.push("/login")
      } catch (error) {
        this.$message.error("退出失败，请重试")
      }
    },
  },
  created() {
    this.fetchUserInfo()

    const urlParams = new URLSearchParams(window.location.search)
    const sectionParam = urlParams.get("section")
    if (
      sectionParam &&
      this.navItems.some((item) => item.id === sectionParam)
    ) {
      this.setActiveSection(sectionParam)
    }

    if (urlParams.get("collectionId")) {
      this.setActiveSection("collections")
    }
  },
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f5fbff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 内联的标题样式 */
.section-title {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.title-content h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.profile-content {
  display: flex;
  gap: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.profile-sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #eee;
  padding: 1.5rem 0;
}

.profile-main {
  flex: 1;
  padding: 1.5rem;
  min-height: 600px;
}

.nav-item {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: rgba(168, 230, 207, 0.1);
  color: #1a91c1;
}

.nav-item.active {
  background-color: rgba(168, 230, 207, 0.2);
  color: #1a91c1;
  border-left: 3px solid #1a91c1;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.profile-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* 密码表单样式 */
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

.submit-btn {
  padding: 0.75rem 1.5rem;
  background-color: #1a91c1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #157aa3;
}

.submit-btn:disabled {
  background-color: #a0c4d4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }

  .profile-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eee;
    padding: 0;
  }

  .nav-item {
    padding: 0.75rem 1.25rem;
  }
}
</style>