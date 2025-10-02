<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="background-elements">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="container">
      <!-- 左侧内容介绍 -->
      <div class="content-section">
        <div class="logo-section">
          <img :src="require('@/assets/logo_below.svg')" alt="Logo" class="main-logo" />
          <h1 class="system-title">肝硬化文献智能系统</h1>
        </div>
        <div class="features-section">
          <div class="feature-item">
            <div class="feature-icon">📚</div>
            <div class="feature-content">
              <h3>文献搜索</h3>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔗</div>
            <div class="feature-content">
              <h3>知识图谱</h3>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔍</div>
            <div class="feature-content">
              <h3>爬虫中心</h3>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <div class="stat-item">
            <div class="stat-number">10,000+</div>
            <div class="stat-label">研究论文</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">500+</div>
            <div class="stat-label">医学期刊</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">2,000+</div>
            <div class="stat-label">研究人员</div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="auth-section">
        <div class="auth-box" :class="{ 'register-active': isRegisterMode }">
          <div class="auth-header">
            <h2>{{ isRegisterMode ? "创建账户" : "欢迎回来" }}</h2>
            <p>{{ isRegisterMode ? "加入我们" : "继续研究" }}</p>
          </div>

          <!-- 登录表单 -->
          <div v-if="!isRegisterMode">
            <form @submit.prevent="login">
              <form-input id="username" label="用户名" type="text" v-model="username" placeholder="请输入用户名"
                :required="true" />

              <form-input id="password" label="密码" type="password" v-model="password" placeholder="请输入密码"
                :required="true" />

              <div class="auth-options">
                <label class="remember-me">
                  <input type="checkbox" v-model="rememberMe">
                  <span>记住我</span>
                </label>
                <a href="#" class="forgot-link">忘记密码？</a>
              </div>

              <primary-button type="submit" :loading="isLoading">
                登录
              </primary-button>

              <div class="switch-mode">
                还没有账户？
                <a href="#" @click.prevent="isRegisterMode = true">立即注册</a>
              </div>
            </form>
          </div>

          <!-- 注册表单 -->
          <div v-else>
            <form @submit.prevent="register">
              <form-input id="reg-username" label="用户名" type="text" v-model="username" placeholder="请选择用户名"
                :required="true" />

              <form-input id="email" label="邮箱" type="email" v-model="email" placeholder="请输入邮箱地址" :required="true" />

              <form-input id="reg-password" label="密码" type="password" v-model="password" placeholder="请创建密码"
                :required="true" />

              <form-input id="confirm-password" label="确认密码" type="password" v-model="confirmPassword"
                placeholder="请确认您的密码" :required="true" />

              <div class="terms-section">
                <label class="terms-checkbox">
                  <input type="checkbox" v-model="agreeTerms" required>
                  <span>我同意<a href="#">服务条款</a>和<a href="#">隐私政策</a></span>
                </label>
              </div>

              <primary-button type="submit" :loading="isLoading">
                创建账户
              </primary-button>

              <div class="switch-mode">
                已有账户？
                <a href="#" @click.prevent="isRegisterMode = false">立即登录</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex"
import User from "@/api/User"
import PrimaryButton from "@/components/ui/PrimaryButton.vue"
import FormInput from "@/components/ui/BaseInput.vue"

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
      isRegisterMode: false,
      isLoading: false,
      rememberMe: false,
      agreeTerms: false,
    }
  },
  methods: {
    ...mapMutations(["setIsAdmin", "setUserId"]),

    async login() {
      if (!this.username || !this.password) {
        this.$message.error("用户名和密码不能为空")
        return
      }

      this.isLoading = true
      try {
        const loginRes = await User.login(this.username, this.password)

        if (!loginRes?.data) {
          this.$message.error(loginRes?.data?.message || "登录失败")
          return
        }

        const userInfo = loginRes.data.data
        localStorage.setItem("token", userInfo.token)

        this.setIsAdmin(userInfo.is_superuser || false)
        this.setUserId(userInfo.id)
        
        console.log('登录成功 - 用户信息:', {
          isAdmin: userInfo.is_superuser,
          userId: userInfo.id,
          username: userInfo.username
        })
        
        this.$router.push("/")
        this.$message.success("欢迎回来！")
      } catch (err) {
        this.$message.error(err?.response?.data?.message || "登录请求失败")
      } finally {
        this.isLoading = false
      }
    },

    async register() {
      if (!this.username || !this.password || !this.confirmPassword || !this.email) {
        this.$message.error("所有字段都是必填的")
        return
      }

      if (this.password !== this.confirmPassword) {
        this.$message.error("密码不匹配")
        return
      }

      if (!this.agreeTerms) {
        this.$message.error("请同意服务条款和条件")
        return
      }

      this.isLoading = true
      try {
        await User.register(this.username, this.email, this.password, this.confirmPassword)
        this.$message.success("注册成功！请登录")
        this.isRegisterMode = false
        // 清空表单
        this.username = ""
        this.email = ""
        this.password = ""
        this.confirmPassword = ""
        this.agreeTerms = false
      } catch (error) {
        this.$message.error(error?.response?.data?.message || "注册失败")
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await User.logout()
        localStorage.removeItem("token")
        this.setUserId(null)
        this.setIsAdmin(false)
        this.$router.push("/login")
        this.$message.success("退出登录成功")
      } catch (error) {
        this.$message.error("退出登录失败")
      }
    },

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
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 50%, #f5fbff 100%);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.background-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 70%;
  left: 10%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  top: 50%;
  right: 10%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.container {
  display: flex;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  align-items: center;
}

.content-section {
  flex: 1;
  padding: 60px 40px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 50%;
  position: relative;
}

.logo-section {
  margin-bottom: 50px;
  text-align: center;
}

.main-logo {
  height: 80px;
  width: auto;
  margin-bottom: 30px;
  filter: brightness(0) invert(1);
}

.system-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 20px;
  line-height: 1.2;
}

.features-section {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  opacity: 0;
  animation: slideInUp 0.6s ease-out forwards;
  max-width: 300px;
}

.feature-item:nth-child(1) {
  animation-delay: 0.2s;
}

.feature-item:nth-child(2) {
  animation-delay: 0.4s;
}

.feature-item:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.feature-content h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.stats-section {
  display: flex;
  gap: 40px;
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  background: linear-gradient(45deg, #ffffff, #a8e6cf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.divider {
  width: 4px;
  background: linear-gradient(to bottom,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 10%,
      rgba(255, 255, 255, 0.8) 30%,
      rgba(255, 255, 255, 1) 50%,
      rgba(255, 255, 255, 0.8) 70%,
      rgba(255, 255, 255, 0.3) 90%,
      transparent 100%);
  margin: 0 40px;
  position: relative;
  flex-shrink: 0;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.5),
    0 0 40px rgba(255, 255, 255, 0.3);
}

.auth-section {
  flex: 0 0 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.auth-box {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 20px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 400px;
  transition: all 0.3s ease;
  border: 1px solid rgba(26, 145, 193, 0.1);
}

.auth-box.register-active {
  max-width: 450px;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #1a91c1;
  margin-bottom: 8px;
}

.auth-header p {
  color: #666;
  margin: 0;
}

.auth-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #555;
}

.remember-me input {
  margin-right: 8px;
  accent-color: #1a91c1;
}

.forgot-link {
  color: #1a91c1;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #a8e6cf;
  text-decoration: underline;
}

.terms-section {
  margin-bottom: 25px;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
  color: #555;
}

.terms-checkbox input {
  margin-right: 8px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: #1a91c1;
}

.terms-checkbox a {
  color: #1a91c1;
  text-decoration: none;
}

.terms-checkbox a:hover {
  text-decoration: underline;
}

.switch-mode {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.switch-mode a {
  color: #1a91c1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.switch-mode a:hover {
  color: #a8e6cf;
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .container {
    flex-direction: column;
  }

  .content-section {
    max-width: 100%;
    padding: 40px 30px 20px;
  }

  .system-title {
    font-size: 2.5rem;
  }

  .divider {
    width: 100%;
    height: 4px;
    margin: 20px 0;
    background: linear-gradient(to right,
        transparent 0%,
        rgba(255, 255, 255, 0.3) 10%,
        rgba(255, 255, 255, 0.8) 30%,
        rgba(255, 255, 255, 1) 50%,
        rgba(255, 255, 255, 0.8) 70%,
        rgba(255, 255, 255, 0.3) 90%,
        transparent 100%);
    border-radius: 2px;
  }

  .divider::before {
    top: 50%;
    left: 50%;
  }

  .auth-section {
    flex: none;
    padding: 20px 30px 40px;
  }

  .stats-section {
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .content-section {
    padding: 30px 20px 20px;
  }

  .system-title {
    font-size: 2rem;
  }

  .features-section {
    margin-bottom: 30px;
  }

  .feature-item {
    margin-bottom: 20px;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
  }

  .stats-section {
    gap: 20px;
  }

  .stat-number {
    font-size: 2rem;
  }

  .auth-section {
    padding: 20px;
  }

  .auth-box {
    padding: 30px 25px;
  }

  .divider {
    margin: 20px 30px;
  }
}

@media (max-width: 480px) {
  .system-title {
    font-size: 1.8rem;
  }

  .stats-section {
    flex-direction: column;
    gap: 15px;
  }

  .auth-box {
    padding: 25px 20px;
  }

  .background-elements {
    display: none;
  }

  .divider {
    margin: 20px;
  }
}
</style>