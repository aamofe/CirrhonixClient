<!-- src/views/PersonalProfilePage.vue -->
<template>
  <div class="profile-page">
    <HeaderComponent />

    <div class="container">
      <SectionTitle title="个人信息" subtitle="管理您的账户信息和偏好设置" />

      <div class="profile-content">
        <!-- 左侧导航 -->
        <div class="profile-sidebar">
          <nav>
            <div
              v-for="(item, index) in navItems"
              :key="index"
              @click="activeSection = item.id"
              :class="['nav-item', activeSection === item.id ? 'active' : '']"
            >
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
            <ProfileForm
              v-if="!loading"
              :user="userInfo"
              @update="updateUserInfo"
            />
            <div v-else class="loading">加载中...</div>
          </div>

          <!-- 收藏夹 -->
          <div v-if="activeSection === 'collections'" class="profile-section">
            <h3>我的收藏夹</h3>
            <div class="collections-header">
              <div class="search-filter">
                <input
                  type="text"
                  v-model="collectionFilter"
                  placeholder="搜索收藏夹..."
                  class="search-input"
                />
              </div>
              <PrimaryButton
                :fullWidth="false"
                @click="showNewCollectionModal = true"
              >
                创建收藏夹
              </PrimaryButton>
            </div>

            <div
              v-if="!collectionsLoading && filteredCollections.length"
              class="collections-grid"
            >
              <CollectionCard
                v-for="collection in filteredCollections"
                :key="collection.id"
                :collection="collection"
                @edit="editCollection"
                @delete="deleteCollection"
              />
            </div>
            <div v-else-if="collectionsLoading" class="loading">加载中...</div>
            <div v-else class="empty-state">您还没有创建任何收藏夹</div>

            <!-- 创建收藏夹模态框 -->
            <ModalComponent
              v-if="showNewCollectionModal"
              title="创建新收藏夹"
              @close="showNewCollectionModal = false"
            >
              <CollectionForm @submit="createCollection" />
            </ModalComponent>

            <!-- 编辑收藏夹模态框 -->
            <ModalComponent
              v-if="showEditCollectionModal"
              title="编辑收藏夹"
              @close="showEditCollectionModal = false"
            >
              <CollectionForm
                v-if="selectedCollection"
                :collection="selectedCollection"
                @submit="updateCollection"
              />
            </ModalComponent>
          </div>

          <!-- 阅读历史 -->
          <div v-if="activeSection === 'history'" class="profile-section">
            <h3>阅读历史</h3>
            <div
              v-if="!historyLoading && readingHistory.length"
              class="reading-history"
            >
              <LiteratureCard
                v-for="item in readingHistory"
                :key="item.id"
                :literature="item.literature"
                :compact="true"
                :showReadDate="true"
                :readDate="item.read_date"
              />
            </div>
            <div v-else-if="historyLoading" class="loading">加载中...</div>
            <div v-else class="empty-state">您还没有阅读记录</div>
          </div>

          <!-- 搜索历史 -->
          <div v-if="activeSection === 'searches'" class="profile-section">
            <h3>搜索历史</h3>
            <div
              v-if="!searchHistoryLoading && searchHistory.length"
              class="search-history"
            >
              <div
                v-for="(search, index) in searchHistory"
                :key="index"
                class="search-history-item"
              >
                <div class="search-query">
                  <router-link
                    :to="{ name: 'search', query: { q: search.query } }"
                  >
                    {{ search.query }}
                  </router-link>
                </div>
                <div class="search-meta">
                  <span class="search-date">{{
                    formatDate(search.search_date)
                  }}</span>
                  <span class="search-results"
                    >{{ search.result_count }} 条结果</span
                  >
                </div>
              </div>
            </div>
            <div v-else-if="searchHistoryLoading" class="loading">
              加载中...
            </div>
            <div v-else class="empty-state">您还没有搜索记录</div>
          </div>

          <!-- 账号设置 -->
          <div v-if="activeSection === 'settings'" class="profile-section">
            <h3>账号设置</h3>
            <div class="settings-container">
              <div class="setting-group">
                <h4>通知设置</h4>
                <div class="setting-item">
                  <label class="switch">
                    <input
                      type="checkbox"
                      v-model="settings.emailNotifications"
                    />
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
                  <PrimaryButton
                    :fullWidth="false"
                    @click="showChangePasswordModal = true"
                  >
                    修改密码
                  </PrimaryButton>
                </div>
              </div>

              <div class="setting-actions">
                <PrimaryButton @click="saveSettings">保存设置</PrimaryButton>
              </div>
            </div>

            <!-- 修改密码模态框 -->
            <ModalComponent
              v-if="showChangePasswordModal"
              title="修改密码"
              @close="showChangePasswordModal = false"
            >
              <PasswordForm @submit="updatePassword" />
            </ModalComponent>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<script>
import HeaderComponent from "@/components/layout/HeaderComponent.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import SectionTitle from "@/components/common/Sectiontitle.vue";
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";
import LiteratureCard from "@/components/cards/LiteratureCard.vue";
import ModalComponent from "@/components/common/ModalComponent.vue";
import ProfileForm from "@/components/form/ProfileForm.vue";
import CollectionForm from "@/components/form/CollectionForm.vue";
import CollectionCard from "@/components/cards/CollectionCard.vue";
import PasswordForm from "@/components/form/PasswordForm.vue";
import Literature from "@/api/Literature";
import Search from "@/api/Search";
import User from "@/api/User"; // 假设您有一个User API类

// 图标组件
import UserIcon from "@/components/icons/UserIcon.vue";
import BookmarkIcon from "@/components/icons/BookmarkIcon.vue";
import HistoryIcon from "@/components/icons/HistoryIcon.vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";
import SettingsIcon from "@/components/icons/SettingsIcon.vue";

export default {
  name: "ProfileView",
  components: {
    HeaderComponent,
    SiteFooter,
    SectionTitle,
    PrimaryButton,
    LiteratureCard,
    ModalComponent,
    ProfileForm,
    CollectionForm,
    CollectionCard,
    PasswordForm,
    UserIcon,
    BookmarkIcon,
    HistoryIcon,
    SearchIcon,
    SettingsIcon,
  },
  data() {
    return {
      activeSection: "basic",
      loading: true,
      collectionsLoading: true,
      historyLoading: true,
      searchHistoryLoading: true,
      userInfo: null,
      collections: [],
      collectionFilter: "",
      readingHistory: [],
      searchHistory: [],
      showNewCollectionModal: false,
      showEditCollectionModal: false,
      showChangePasswordModal: false,
      selectedCollection: null,
      settings: {
        emailNotifications: true,
      },
      navItems: [
        { id: "basic", label: "基本信息", icon: "UserIcon" },
        { id: "collections", label: "我的收藏夹", icon: "BookmarkIcon" },
        { id: "history", label: "阅读历史", icon: "HistoryIcon" },
        { id: "searches", label: "搜索历史", icon: "SearchIcon" },
        { id: "settings", label: "账号设置", icon: "SettingsIcon" },
      ],
    };
  },
  computed: {
    filteredCollections() {
      if (!this.collectionFilter) return this.collections;

      const filter = this.collectionFilter.toLowerCase();
      return this.collections.filter(
        (collection) =>
          collection.name.toLowerCase().includes(filter) ||
          (collection.description &&
            collection.description.toLowerCase().includes(filter))
      );
    },
  },
  methods: {
    async fetchUserInfo() {
      this.loading = true;
      try {
        // 假设您有一个获取用户信息的API
        const response = await User.getUserInfo();
        this.userInfo = response.data;
      } catch (error) {
        console.error("获取用户信息失败", error);
        // 处理错误
      } finally {
        this.loading = false;
      }
    },

    async fetchCollections() {
      this.collectionsLoading = true;
      try {
        const response = await Literature.getCollections();
        this.collections = response.data.items || [];
      } catch (error) {
        console.error("获取收藏夹失败", error);
      } finally {
        this.collectionsLoading = false;
      }
    },

    async fetchReadingHistory() {
      this.historyLoading = true;
      try {
        const response = await Literature.getInteractions({
          is_read: true,
          sort: "-updated_at",
        });
        this.readingHistory = response.data.items || [];
      } catch (error) {
        console.error("获取阅读历史失败", error);
      } finally {
        this.historyLoading = false;
      }
    },

    async fetchSearchHistory() {
      this.searchHistoryLoading = true;
      try {
        const response = await Search.getSearchHistory();
        this.searchHistory = response.data.items || [];
      } catch (error) {
        console.error("获取搜索历史失败", error);
      } finally {
        this.searchHistoryLoading = false;
      }
    },

    async updateUserInfo(data) {
      try {
        // 假设您有一个更新用户信息的API
        await User.updateUserInfo(data);
        this.userInfo = { ...this.userInfo, ...data };
        this.$toast.success("个人信息更新成功");
      } catch (error) {
        console.error("更新用户信息失败", error);
        this.$toast.error("个人信息更新失败");
      }
    },

    async createCollection(data) {
      try {
        const response = await Literature.createCollection(data);
        this.collections.unshift(response.data);
        this.showNewCollectionModal = false;
        this.$toast.success("收藏夹创建成功");
      } catch (error) {
        console.error("创建收藏夹失败", error);
        this.$toast.error("创建收藏夹失败");
      }
    },

    editCollection(collection) {
      this.selectedCollection = collection;
      this.showEditCollectionModal = true;
    },

    async updateCollection(data) {
      try {
        await Literature.updateCollection(this.selectedCollection.id, data);

        // 更新本地集合数据
        const index = this.collections.findIndex(
          (c) => c.id === this.selectedCollection.id
        );
        if (index !== -1) {
          this.collections[index] = {
            ...this.collections[index],
            ...data,
          };
        }

        this.showEditCollectionModal = false;
        this.selectedCollection = null;
        this.$toast.success("收藏夹更新成功");
      } catch (error) {
        console.error("更新收藏夹失败", error);
        this.$toast.error("更新收藏夹失败");
      }
    },

    async deleteCollection(collection) {
      if (!confirm(`确定要删除收藏夹"${collection.name}"吗？`)) return;

      try {
        await Literature.deleteCollection(collection.id);
        this.collections = this.collections.filter(
          (c) => c.id !== collection.id
        );
        this.$toast.success("收藏夹删除成功");
      } catch (error) {
        console.error("删除收藏夹失败", error);
        this.$toast.error("删除收藏夹失败");
      }
    },

    async updatePassword(data) {
      try {
        // 假设您有一个更新密码的API
        await User.updatePassword(data);
        this.showChangePasswordModal = false;
        this.$toast.success("密码修改成功");
      } catch (error) {
        console.error("密码修改失败", error);
        this.$toast.error("密码修改失败");
      }
    },

    async saveSettings() {
      try {
        // 假设您有一个保存设置的API
        await User.updateSettings(this.settings);
        this.$toast.success("设置保存成功");
      } catch (error) {
        console.error("保存设置失败", error);
        this.$toast.error("保存设置失败");
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  created() {
    this.fetchUserInfo();
    this.fetchCollections();
    this.fetchReadingHistory();
    this.fetchSearchHistory();
  },
};
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

.collections-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 300px;
  font-size: 14px;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.reading-history,
.search-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-history-item {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
}

.search-history-item:hover {
  background-color: rgba(168, 230, 207, 0.05);
  border-color: rgba(26, 145, 193, 0.3);
}

.search-query {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.search-meta {
  display: flex;
  justify-content: space-between;
  color: #777;
  font-size: 13px;
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

input:checked + .slider {
  background-color: #1a91c1;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.setting-actions {
  margin-top: 2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #777;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
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

  .collections-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-input {
    width: 100%;
  }
}
</style>
