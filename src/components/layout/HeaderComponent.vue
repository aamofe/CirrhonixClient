<!-- src/components/layout/HeaderComponent.vue -->
<template>
  <header>
    <div class="header-container">
      <div class="logo-container" @click="goToHome">
        <img :src="require('@/assets/logo_below.svg')" alt="Logo Below" />
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
        <div class="avatar">{{ getUserInitial }}</div>
        <span class="username">{{ username }}</span>
      </div>
    </div>
  </header>
</template>

<script>
import User from "@/api/User";

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
    };
  },
  computed: {
    getUserInitial() {
      return this.username ? this.username.charAt(0).toUpperCase() : "U";
    },
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
        this.$message.success(`当前用户：${data.username}`);
      } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 401) {
          this.username = "";
        } else {
          this.$message.error("获取用户信息失败");
        }
      }
    },
    // updateFromUserInfo(userInfo) {
    //   if (userInfo && userInfo.username) {
    //     this.username = userInfo.username;
    //   }
    // },
  },
  mounted() {
    const token = localStorage.getItem("token");
    if (token) {
      this.getProfile();
    }
  },
  beforeUnmount() {
    // this.$bus.off("update-navigator");
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
}

.logo {
  height: 40px;
}

nav ul {
  display: flex;
  list-style: none;
}

nav ul li {
  margin-left: 25px;
}

nav ul li a {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.3s;
}

nav ul li a:hover {
  color: #1a91c1;
}

nav ul li a.active {
  color: #1a91c1;
  border-bottom: 2px solid #1a91c1;
  padding-bottom: 3px;
}

.user-area {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-area .avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #a8e6cf;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.user-area .username {
  margin-right: 20px;
  color: #555;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
  }

  nav ul {
    margin-top: 15px;
    flex-wrap: wrap;
  }

  nav ul li {
    margin-left: 0;
    margin-right: 15px;
    margin-bottom: 10px;
  }

  .user-area {
    margin-top: 15px;
    align-self: flex-end;
  }
}
</style>
