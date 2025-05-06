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
            <router-link
              :to="item.path"
              :class="{ active: isActive(item.path) }"
            >
              {{ item.name }}
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="user-area" @click="goToProfile">
        <div class="avatar-container">
          <img :src="defaultAvatar" alt="用户头像" class="avatar-image" />
        </div>
        <span class="username">{{ username || '登录' }}</span>
      </div>
    </div>
  </header>
</template>

<script>
import User from "@/api/User";
import defaultAvatar from "@/assets/female.png"
export default {
  name: "HeaderComponent",
  data() {
    return {
      username: "",
      navItems: [
        { name: "首页", path: "/" },
        { name: "文献检索", path: "/search" },
        { name: "知识图谱", path: "/knowledge-graph" },
        { name: "爬虫中心", path: "/crawler" },
        // { name: "个人中心", path: "/profile" },
      ],
      defaultAvatar,
    };
  },
  methods: {
    isActive(path) {
      // 检查当前路由是否匹配导航项
      return this.$route.path === path;
    },
    goToHome() {
      this.$router.push("/");
    },
    goToProfile() {
      if (!this.username) {
        this.$router.push("/login");
      } else {
        this.$router.push("/profile");
      }
    },
    async getProfile() {
      try {
        const response = await User.profile();
        const data = response.data.data;
        this.username = data.username;
      } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 401) {
          this.username = "";
        } else {
          this.$message.error("获取用户信息失败");
        }
      }
    },
  },
  mounted() {
    const token = localStorage.getItem("token");
    if (token) {
      this.getProfile();
    }
  },
};
</script>

<style scoped>
header {
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 5%;
  max-width: 1400px;
  margin: 0 auto;
}

.logo-container {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.logo {
  height: 45px;
  width: auto;
}

nav {
  flex-grow: 1;
  display: flex;
  justify-content: center;
}

nav ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

nav ul li {
  margin: 0 15px;
}

nav ul li a {
  text-decoration: none;
  color: #555;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s;
  padding: 8px 12px;
  border-radius: 4px;
}

nav ul li a:hover {
  color: #1a91c1;
  background-color: rgba(26, 145, 193, 0.1);
}

nav ul li a.active {
  color: #1a91c1;
  border-bottom: 3px solid #1a91c1;
  padding-bottom: 5px;
  font-weight: 700;
}

.user-area {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 20px;
  transition: background-color 0.3s;
}

.user-area:hover {
  background-color: #f5f5f5;
}

.avatar-container {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  border: 2px solid #1a91c1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-area .username {
  color: #555;
  font-weight: 500;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
  }

  nav {
    width: 100%;
    margin: 15px 0;
  }

  nav ul {
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }

  nav ul li {
    margin: 5px 10px;
  }

  .user-area {
    align-self: flex-end;
  }
}
</style>