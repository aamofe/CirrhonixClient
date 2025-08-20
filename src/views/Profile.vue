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
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
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
            <ProfileForm v-if="!loading" :user="userInfo" @profileUpdated="updateLocalUserInfo"
              @showPasswordModal="showChangePasswordModal = true" @logout="logout" />
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
          <!-- <div v-if="activeSection === 'searches'" class="profile-section">
            <SearchHistoryComponent />
          </div> -->
        </div>
      </div>
    </div>

    <!-- 修改密码模态框 -->
    <ModalComponent v-if="showChangePasswordModal" title="修改密码" @close="showChangePasswordModal = false">
      <PasswordForm @cancel="showChangePasswordModal = false" />
    </ModalComponent>
  </div>
</template>

<script>
import SectionTitle from "@/components/common/Sectiontitle.vue"
import ModalComponent from "@/components/common/ModalComponent.vue"
import PasswordForm from "@/components/form/PasswordForm.vue"
import User from "@/api/User"


import ProfileForm from "@/components/profile/ProfileForm.vue"
import CollectionsComponent from "@/components/profile/Collections.vue"
import ReadingHistoryComponent from "@/components/profile/ReadingHistory.vue"
// import SearchHistoryComponent from "@/components/profile/SearchHistory.vue";


import {
  User as UserIcon,
  Collection as BookmarkIcon,
  Clock as HistoryIcon,
  Search as SearchIcon,
} from "@element-plus/icons-vue"

export default {
  name: "ProfileView",
  components: {
    SectionTitle,
    ProfileForm,
    CollectionsComponent,
    ReadingHistoryComponent,
    // SearchHistoryComponent,
    ModalComponent,
    PasswordForm,
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
    }
  },
  methods: {
    async fetchUserInfo() {
      this.loading = true
      try {
        const response = await User.profile()
        this.userInfo = response.data.data
      } catch (error) {
        ;

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

    async logout() {
      try {
        await User.logout()
        this.$message.success("退出登录成功")


        localStorage.removeItem("token")
        sessionStorage.removeItem("profileActiveSection")


        this.$router.push("/login")
      } catch (error) {
        ;
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
