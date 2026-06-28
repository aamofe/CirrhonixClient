<template>
  <div class="login-page">
    <div class="container">
      <div class="content-section">
        <div class="logo-section">
          <img :src="require('@/assets/logo_below.svg')" alt="Logo" class="main-logo" />
          <h1 class="system-title">肝硬化文献智能系统</h1>
        </div>
        <div class="features-section">
          <div class="feature-item">
            <span class="feature-icon">📚</span>
            <h3>文献搜索</h3>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔗</span>
            <h3>知识图谱</h3>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔍</span>
            <h3>爬虫中心</h3>
          </div>
        </div>
      </div>

      <div class="auth-section">
        <div class="auth-box">
          <div class="auth-header">
            <h2>{{ isRegisterMode ? "创建账户" : "欢迎回来" }}</h2>
            <p>{{ isRegisterMode ? "加入我们" : "继续研究" }}</p>
          </div>

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
                <a href="#" class="link">忘记密码？</a>
              </div>
              <primary-button type="submit" :loading="isLoading" full-width>
                登录
              </primary-button>
              <div class="switch-mode">
                还没有账户？
                <a href="#" class="link" @click.prevent="isRegisterMode = true">立即注册</a>
              </div>
            </form>
          </div>

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
                  <span>我同意<a href="#" class="link">服务条款</a>和<a href="#" class="link">隐私政策</a></span>
                </label>
              </div>
              <primary-button type="submit" :loading="isLoading" full-width>
                创建账户
              </primary-button>
              <div class="switch-mode">
                已有账户？
                <a href="#" class="link" @click.prevent="isRegisterMode = false">立即登录</a>
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
  },
}
</script>

<style scoped>
.login-page {
  background: var(--gradient-primary);
  min-height: 100vh;
}

.container {
  display: flex;
  min-height: 100vh;
  align-items: center;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
  gap: 60px;
}

.content-section {
  flex: 1;
  text-align: center;
}

.logo-section {
  margin-bottom: 40px;
}

.main-logo {
  height: 64px;
  width: auto;
  margin-bottom: 20px;
  filter: brightness(0) invert(1);
}

.system-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.features-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.feature-icon {
  font-size: 2rem;
}

.feature-item h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.auth-section {
  flex: 0 0 400px;
}

.auth-box {
  background: white;
  padding: 36px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-header h2 {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.auth-header p {
  color: var(--color-text-muted);
  margin: 0;
}

.auth-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  accent-color: var(--color-primary);
}

.link {
  color: var(--color-primary);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.terms-section {
  margin-bottom: 20px;
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
  accent-color: var(--color-primary);
}

.switch-mode {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
    gap: 40px;
  }

  .auth-section {
    flex: none;
    width: 100%;
    max-width: 400px;
  }

  .system-title {
    font-size: 2rem;
  }
}
</style>
