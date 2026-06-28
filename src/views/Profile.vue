<template>
  <div class="profile-page">
    <div class="container">
      <div class="section-title">
        <div class="title-content">
          <h2>个人信息</h2>
        </div>
      </div>
      <div class="profile-content">
        <SideNav
          :items="navItems"
          :active-section="activeSection"
          variant="embedded"
          @change="setActiveSection"
        />

        <div class="profile-main">
          <div v-if="activeSection === 'basic'" class="profile-section">
            <h3>基本信息</h3>
            <ProfileForm v-if="!loading" :user="userInfo" @profileUpdated="updateLocalUserInfo"
              @showPasswordModal="showChangePasswordModal = true" @logout="logout" />
            <LoadingSpinner v-else />
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
          <el-input id="oldPassword" v-model="passwordForm.oldPassword" type="password" show-password
            placeholder="输入当前密码" />
        </div>

        <div class="form-group">
          <label for="newPassword">新密码</label>
          <el-input id="newPassword" v-model="passwordForm.newPassword" type="password" show-password
            placeholder="输入新密码" />
          <small class="form-hint">密码长度至少8位，建议包含字母、数字和特殊字符</small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认新密码</label>
          <el-input id="confirmPassword" v-model="passwordForm.confirmPassword" type="password" show-password
            placeholder="再次输入新密码" />
          <small v-if="passwordMismatch" class="form-error">两次输入的密码不一致</small>
        </div>

        <div class="form-actions">
          <CancelButton @click="closePasswordModal"> 取消 </CancelButton>
          <PrimaryButton type="submit" :loading="isPasswordSubmitting" :disabled="passwordMismatch">
            确认修改
          </PrimaryButton>
        </div>
      </form>
    </ModalComponent>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import ModalComponent from "@/components/ui/BaseModal.vue"
import CancelButton from "@/components/ui/CancelButton.vue"
import PrimaryButton from "@/components/ui/PrimaryButton.vue"
import SideNav from "@/components/ui/SideNav.vue"
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue"
import User from "@/api/User"
import notify from "@/utils/notify"

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
    CancelButton,
    PrimaryButton,
    SideNav,
    LoadingSpinner,
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
    ...mapMutations(["setIsAdmin", "setUserId", "setUserAvatar"]),

    async fetchUserInfo() {
      this.loading = true
      try {
        const response = await User.profile()
        this.userInfo = response.data.data
        
        // 更新 Vuex store - 注意：后端字段是 is_superuser（没有下划线）
        this.setIsAdmin(this.userInfo.is_superuser || false)
        this.setUserId(this.userInfo.id)
        this.setUserAvatar(this.userInfo.avatar_url)
        
        // console.log('Profile 页面 - 用户信息已更新到 store:', {
        //   isAdmin: this.userInfo.is_superuser,
        //   userId: this.userInfo.id
        // })
      } catch (error) {
        if (error.response?.status !== 401) {
          notify.apiError(error, "获取用户信息失败")
        }
      } finally {
        this.loading = false
      }
    },

    updateLocalUserInfo(updatedUserInfo) {
      this.userInfo = updatedUserInfo
      // 同时更新 store - 注意：后端字段是 is_superuser（没有下划线）
      this.setIsAdmin(updatedUserInfo.is_superuser || false)
      this.setUserId(updatedUserInfo.id)
      this.setUserAvatar(updatedUserInfo.avatar_url)
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

        notify.success("密码修改成功")
        this.resetPasswordForm()
        this.closePasswordModal()
      } catch (error) {
        notify.error("密码修改失败，请检查旧密码是否正确")
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
        notify.success("退出登录成功")

        localStorage.removeItem("token")
        sessionStorage.removeItem("profileActiveSection")
        
        // 清空 store
        this.setIsAdmin(false)
        this.setUserId("")
        this.setUserAvatar("")

        this.$router.push("/login")
      } catch (error) {
        notify.error("退出失败，请重试")
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
  background-color: var(--color-bg);
}

.container {
  max-width: var(--max-width-content);
  margin: 0 auto;
  padding: var(--spacing-page);
}

.profile-content {
  display: flex;
  gap: 2rem;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.profile-main {
  flex: 1;
  padding: 1.5rem;
  min-height: 600px;
}

.profile-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 600;
}

.password-form {
  width: 100%;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
}
</style>