<!-- src/views/PersonalProfilePage.vue -->
<template>
  <div class="profile-page">
    <div class="container">
      <SectionTitle title="个人信息" subtitle="管理您的账户信息和偏好设置" />

      <div class="profile-content">
        <!-- 左侧导航 -->
        <div class="profile-sidebar">
          <nav>
            <div v-for="(item, index) in navItems" :key="index" @click="setActiveSection(item.id)"
              :class="['nav-item', activeSection === item.id ? 'active' : '']">
              <span class="nav-icon">
                <component :is="item.icon" />
              </span>
              <span>{{ item.label }}</span>
            </div>
          </nav>
        </div>

        <!-- 右侧内容 -->
        <div class="profile-main">
          <!-- 基本信息 -->
          <div v-if="activeSection === 'basic'" class="profile-section">
            <h3>基本信息</h3>
            <ProfileForm v-if="!loading" :user="userInfo" @profileUpdated="updateLocalUserInfo" />
            <div v-else class="loading">加载中...</div>
          </div>

          <!-- 收藏夹 -->
          <div v-if="activeSection === 'collections'" class="profile-section">
            <CollectionsComponent />
          </div>

          <!-- 阅读历史 -->
          <div v-if="activeSection === 'history'" class="profile-section">
            <ReadingHistoryComponent />
          </div>

          <!-- 搜索历史 -->
          <div v-if="activeSection === 'searches'" class="profile-section">
            <SearchHistoryComponent />
          </div>

          <!-- 账号设置 -->
          <div v-if="activeSection === 'settings'" class="profile-section">
            <AccountSettingsComponent />
          </div>
        </div>
      </div>
    </div>

    <!-- <SiteFooter /> -->
  </div>
</template>

<script>
import SectionTitle from "@/components/common/Sectiontitle.vue"

import User from "@/api/User"

// 导入新拆分的组件
import ProfileForm from "@/components/profile/ProfileForm.vue"
import CollectionsComponent from "@/components/profile/Collections.vue"
import ReadingHistoryComponent from "@/components/profile/ReadingHistory.vue"
import SearchHistoryComponent from "@/components/profile/SearchHistory.vue"
import AccountSettingsComponent from "@/components/profile/AccountSettings.vue"

// 图标组件
import UserIcon from "@/components/icons/UserIcon.vue"
import BookmarkIcon from "@/components/icons/BookmarkIcon.vue"
import HistoryIcon from "@/components/icons/HistoryIcon.vue"
import SearchIcon from "@/components/icons/SearchIcon.vue"
import SettingsIcon from "@/components/icons/SettingsIcon.vue"

export default {
  name: "ProfileView",
  components: {
    // SiteFooter,
    SectionTitle,
    ProfileForm,
    CollectionsComponent,
    ReadingHistoryComponent,
    SearchHistoryComponent,
    AccountSettingsComponent,
    UserIcon,
    BookmarkIcon,
    HistoryIcon,
    SearchIcon,
    SettingsIcon,
  },
  data() {
    return {
      activeSection: this.getSavedSection(),
      loading: true,
      userInfo: null,
      navItems: [
        { id: "basic", label: "基本信息", icon: "UserIcon" },
        { id: "collections", label: "我的收藏夹", icon: "BookmarkIcon" },
        { id: "history", label: "阅读历史", icon: "HistoryIcon" },
        { id: "searches", label: "搜索历史", icon: "SearchIcon" },
        { id: "settings", label: "账号设置", icon: "SettingsIcon" },
      ],
    }
  },
  methods: {
    async fetchUserInfo() {
      this.loading = true
      try {
        const response = await User.profile()
        this.userInfo = response.data.data
      } catch (error) {
        console.error("获取用户信息失败", error)
        // 处理错误
      } finally {
        this.loading = false
      }
    },

    // 更新本地用户信息（来自子组件的更新通知）
    updateLocalUserInfo(updatedUserInfo) {
      this.userInfo = updatedUserInfo
    },

    // 设置当前活跃标签并保存到sessionStorage
    setActiveSection(sectionId) {
      this.activeSection = sectionId
      sessionStorage.setItem('profileActiveSection', sectionId)
    },

    // 从sessionStorage获取上次保存的标签ID
    getSavedSection() {
      const savedSection = sessionStorage.getItem('profileActiveSection')
      return savedSection || 'basic' // 如果没有保存过，默认为'basic'
    },
  },
  created() {
    this.fetchUserInfo()

    // 监听路由变化，在URL中有查询参数时处理
    const urlParams = new URLSearchParams(window.location.search)
    const sectionParam = urlParams.get('section')
    if (sectionParam && this.navItems.some(item => item.id === sectionParam)) {
      this.setActiveSection(sectionParam)
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

.profile-content {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
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