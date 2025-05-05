<template>
  <div class="login-page">
    <!-- 语言选择器 -->
    <div class="language-selector">
      <select>
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
    </div>

    <div class="liver-shape"></div>

    <div class="container">
      <div class="login-box" :class="{ 'register-active': isRegisterMode }">
        <!-- Logo区域 -->
        <div class="logo-container">
          <img :src="require('@/assets/logo_below.svg')" alt="Logo Below" />
        </div>

        <!-- 标题 -->
        <h1>{{ isRegisterMode ? "注册新账号" : "肝硬化文献智能检索系统" }}</h1>

        <!-- 登录表单 -->
        <div v-if="!isRegisterMode">
          <form @submit.prevent="login">
            <form-input id="username" label="用户名" type="text" v-model="username" placeholder="请输入您的用户名"
              :required="true" />

            <form-input id="password" label="密码" type="password" v-model="password" placeholder="请输入您的密码"
              :required="true" />

            <div class="forgot-password">
              <a href="#">忘记密码？</a>
            </div>

            <primary-button type="submit"> 登 录 </primary-button>

            <div class="register-link">
              还没有账号？<a href="#" @click.prevent="isRegisterMode = true">立即注册</a>
            </div>
          </form>
        </div>

        <!-- 注册表单 -->
        <div v-else>
          <form @submit.prevent="register">
            <form-input id="reg-username" label="用户名" type="text" v-model="username" placeholder="请输入用户名"
              :required="true" />

            <form-input id="email" label="邮箱" type="email" v-model="email" placeholder="请输入您的邮箱" :required="true" />

            <form-input id="reg-password" label="密码" type="password" v-model="password" placeholder="请输入密码"
              :required="true" />

            <form-input id="confirm-password" label="确认密码" type="password" v-model="confirmPassword"
              placeholder="请再次输入密码" :required="true" />

            <primary-button type="submit"> 注 册 </primary-button>

            <div class="register-link">
              已有账号？<a href="#" @click.prevent="isRegisterMode = false">返回登录</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex"
import service from "@/utils/request"
import User from "@/api/User"
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import FormInput from "@/components/form/FormInput.vue"

export default {
  name: "LoginView",
  components: {
    PrimaryButton,
    FormInput,
  },
  data() {
    return {
      username: "",
      password: "",
      email: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      isRegisterMode: false,
    }
  },
  methods: {
    ...mapMutations(["setIsAdmin", "setUserId"]),

    async login() {
      if (!this.username || !this.password) {
        this.$message.error("用户名和密码不得为空")
        return
      }
      try {
        const loginRes = await User.login(this.username, this.password)

        if (!loginRes?.data) {
          this.$message.error(loginRes?.data?.message || "登录失败")
          return
        }
        const token = loginRes.data.data.token
        console.log(token)
        localStorage.setItem("token", token)
        try {
          const profileRes = await User.profile()
          if (!profileRes?.data?.data) {
            this.$message.error("获取用户信息失败")
            return
          }
          const userInfo = profileRes.data.data
          this.setIsAdmin(userInfo.is_super_user)
          this.setUserId(userInfo.id)

          // 发送事件通知，并传递用户信息
          this.$bus.emit("update-navigator", userInfo)

          this.$router.push("/")
        } catch (err) {
          this.$message.error("获取用户资料失败")
        }
      } catch (err) {
        this.$message.error(err?.response?.data?.message || "登录请求出错")
      }
    },

    async register() {
      if (
        !this.username ||
        !this.password ||
        !this.confirmPassword ||
        !this.email
      ) {
        this.$message.error("所有字段均为必填")
        return
      }

      if (this.password !== this.confirmPassword) {
        this.$message.error("两次密码不一致")
        return
      }

      try {
        const res = await User.register(
          this.username,
          this.email,
          this.password,
          this.confirmPassword
        )

        if (res.data.code === 201) {
          this.$message.success("注册成功，请登录")
          this.isRegisterMode = false
        } else {
          this.$message.error(res.data.message || "注册失败")
        }
      } catch (error) {
        this.$message.error("注册请求出错")
      }
    },

    // 登出
    async logout() {
      try {
        await User.logout()
        localStorage.removeItem("token")
        delete service.defaults.headers.common["Authorization"]
        this.setUserId(null)
        this.setIsAdmin(false)
        this.$router.push("/login")
        this.$message.success("已登出")
      } catch (error) {
        this.$message.error("登出失败")
      }
    },

    // 获取当前用户信息
    async getProfile() {
      try {
        const response = await User.profile()
        const data = response.data.data
        this.$message.success(`当前用户：${data.username}`)
      } catch (error) {
        this.$message.error("获取用户信息失败")
      }
    },
  },
}
</script>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #0e5a84 0%, #f5fbff 100%);
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.language-selector {
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  font-size: 14px;
  z-index: 10;
}

.language-selector select {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  transition: all 0.3s;
}

.language-selector select:hover {
  background: rgba(255, 255, 255, 0.3);
}

.language-selector select option {
  background: #0e5a84;
  color: white;
}

.container {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-box {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(10, 30, 60, 0.2);
  width: 400px;
  max-width: 90%;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.login-box.register-active {
  width: 450px;
}

.logo-container {
  text-align: center;
  margin-bottom: 30px;
}

.logo-container svg {
  height: 60px;
  width: auto;
}

h1 {
  font-size: 24px;
  color: #1a91c1;
  margin-bottom: 25px;
  text-align: center;
  font-weight: 500;
}

.forgot-password {
  text-align: right;
  margin-bottom: 25px;
}

.forgot-password a {
  color: #1a91c1;
  font-size: 14px;
  text-decoration: none;
}

.forgot-password a:hover {
  text-decoration: underline;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #1a91c1;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

.liver-shape {
  position: absolute;
  bottom: -150px;
  right: -100px;
  width: 600px;
  height: 600px;
  background: radial-gradient(ellipse at center,
      rgba(168, 230, 207, 0.15) 0%,
      rgba(168, 230, 207, 0) 70%);
  border-radius: 50% 50% 50% 70%;
  transform: rotate(45deg);
  z-index: 0;
}

@media (max-width: 768px) {
  .login-box {
    padding: 30px;
  }

  .liver-shape {
    opacity: 0.3;
  }
}
</style>
