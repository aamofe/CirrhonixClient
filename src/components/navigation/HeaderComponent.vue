<!-- src/components/layout/HeaderComponent.vue -->
<template>
  <header>
    <div class="header-container">
      <div class="logo-container" @click="goToHome">
        <img src="@/assets/logo_below.svg" alt="Logo Below" class="logo" />
      </div>

      <nav>
        <ul>
          <li v-for="(item, index) in navItems" :key="index">
            <router-link :to="item.path" :class="{ active: isActive(item.path) }">
              <span>{{ item.name }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="user-area" @click="goToProfile">
        <div class="avatar-container">
          <img :src="avatar" alt="用户头像" class="avatar-image" />
        </div>
        <span class="username">{{ username || "登录" }}</span>
      </div>
    </div>
  </header>
</template>

<script>
import { mapMutations } from 'vuex'
import User from "@/api/User"
import bus from '@/utils/bus'

export default {
  name: "HeaderComponent",
  data() {
    return {
      username: "",
      navItems: [
        { name: "首页", path: "/" },
        { name: "文献库", path: "/literature" },
        { name: "知识图谱", path: "/knowledge-graph" },
        { name: "数据源", path: "/crawler" }
      ],
      avatar: null,
    }
  },
  methods: {
    ...mapMutations(["setIsAdmin", "setUserId", "setUserAvatar"]),

    isActive(path) {
      if (path === '/') {
        return this.$route.path === path
      }
      return this.$route.path.startsWith(path)
    },
    goToHome() {
      this.$router.push("/")
    },
    goToProfile() {
      if (!this.username) {
        this.$router.push("/login")
      } else {
        this.$router.push("/profile")
      }
    },
    async getProfile() {
      try {
        const response = await User.profile()
        const data = response.data.data
        
        // 更新本地数据
        this.username = data.username
        this.avatar = data.avatar_url
        
        // 更新 Vuex store - 注意：后端字段是 is_superuser（没有下划线）
        this.setIsAdmin(data.is_superuser || false)
        this.setUserId(data.id)
        this.setUserAvatar(data.avatar_url)
        
        console.log('用户信息已更新到 store:', {
          isAdmin: data.is_superuser,
          userId: data.id
        })
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.username = ""
          // 清空 store
          this.setIsAdmin(false)
          this.setUserId("")
          this.setUserAvatar("")
        } else {
          this.$message.error("获取用户信息失败")
        }
      }
    },
  },
  mounted() {
    const token = localStorage.getItem("token")
    if (token) {
      this.getProfile()
    }
    bus.on('avatar-updated', (newAvatar) => {
      this.avatar = newAvatar
      this.setUserAvatar(newAvatar)
    })
  },
  beforeUnmount() {
    bus.off('avatar-updated')
  }
}
</script>

<style scoped>
header {
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #e8f4f8;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 2%;
  max-width: 1400px;
  margin: 0 auto;
}

.logo-container {
  cursor: pointer;
  display: flex;
  align-items: center;
  flex: 0 0 140px;
  transition: opacity 0.3s ease;
}

.logo-container:hover {
  opacity: 0.8;
}

.logo {
  height: 42px;
  width: auto;
}

nav {
  flex: 1;
  display: flex;
  justify-content: center;
}

nav ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
}

nav ul li a {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #5a6c7d;
  font-weight: 500;
  font-size: 15px;
  padding: 10px 18px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  background-color: transparent;
}

nav ul li a:hover {
  color: #1a91c1;
  background-color: rgba(26, 145, 193, 0.08);
  transform: translateY(-1px);
}

nav ul li a.active {
  color: #1a91c1;
  background-color: rgba(26, 145, 193, 0.12);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(26, 145, 193, 0.15);
}

.user-area {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 24px;
  transition: all 0.3s ease;
  flex: 0 0 140px;
  justify-content: flex-end;
  background-color: transparent;
}

.user-area:hover {
  background-color: rgba(26, 145, 193, 0.06);
  transform: translateY(-1px);
}

.avatar-container {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  border: 2px solid #1a91c1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s ease;
}

.user-area:hover .avatar-container {
  border-color: #0d7aa7;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-area .username {
  color: #5a6c7d;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.3s ease;
}

.user-area:hover .username {
  color: #1a91c1;
}

@media (max-width: 1100px) {
  .header-container {
    padding: 10px 1.5%;
  }

  .logo-container {
    flex: 0 0 120px;
  }

  .user-area {
    flex: 0 0 120px;
  }

  nav ul {
    gap: 4px;
  }

  nav ul li a {
    padding: 9px 14px;
    font-size: 14px;
  }
}

@media (max-width: 900px) {
  .logo {
    height: 38px;
  }

  nav ul li a {
    padding: 10px 18px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 8px 1%;
  }

  .logo-container {
    flex: 0 0 100px;
  }

  .user-area {
    flex: 0 0 100px;
  }

  .avatar-container {
    width: 32px;
    height: 32px;
    margin-right: 8px;
  }

  .user-area .username {
    font-size: 14px;
  }
}

@media (max-width: 576px) {
  .header-container {
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
  }

  .logo-container,
  .user-area {
    flex: 0 0 auto;
  }

  nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  nav ul li a {
    padding: 8px 12px;
    border-radius: 20px;
  }
}
</style>