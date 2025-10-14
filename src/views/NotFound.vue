<template>
  <div class="not-found-page">
    <div class="error-container">
      <div class="error-header">
        <h1>404 - 页面未找到</h1>
      </div>

      <div class="error-card">
        <div class="card-icon">
          <i class="icon-warning"></i>
        </div>
        <div class="card-content">
          <h2>系统升级中，功能暂不存在</h2>
          <p class="message-text">
            您尝试访问的页面或功能当前正在进行升级，暂时无法提供服务。
            <br>
            我们致力于为您提供更强大的肝硬化文献智能检索能力。
          </p>
          <p class="secondary-message">
            请尝试返回首页或稍后再试。
          </p>
          <primary-button @click="$router.push('/')">
            返回首页
          </primary-button>
        </div>
      </div>

      <div class="contact-info">
        <p>如有紧急需求，请联系技术支持。</p>
      </div>
    </div>
    
    <site-footer />
  </div>
</template>

<script>
import PrimaryButton from "@/components/ui/PrimaryButton.vue"
import SiteFooter from "@/components/navigation/SiteFooter.vue"

export default {
  name: "NotFoundView",
  components: {
    PrimaryButton,
    SiteFooter,
  },
}
</script>

<style scoped>
/* 继承自 Home.vue 的背景和通用布局 */
.not-found-page {
  background-color: #f8fcff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.error-container {
  flex-grow: 1;
  max-width: 800px;
  margin: 50px auto;
  padding: 30px 5%;
  text-align: center;
}

.error-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  color: white;
  padding: 20px 0;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 4px 10px rgba(26, 145, 193, 0.2);
  margin-bottom: 20px;
}

.error-header h1 {
  font-size: 32px;
  margin: 0;
  font-weight: 700;
}

/* 仿照主页卡片样式 */
.error-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-icon {
  /* 继承主页 workspace-card 的 icon 样式 */
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #ff9100, #ffc107); /* 使用警告色调 */
  border-radius: 50%;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30px;
}

.card-content {
  text-align: center;
}

.card-content h2 {
  color: #333;
  font-size: 24px;
  margin: 0 0 15px;
  font-weight: 600;
}

.message-text {
  color: #555;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 25px;
}

.message-text strong {
  color: #1a91c1; /* 使用主色调突出关键字 */
}

.secondary-message {
  color: #888;
  font-size: 14px;
  margin-bottom: 30px;
}

.contact-info {
  margin-top: 30px;
  color: #999;
  font-size: 13px;
}

/* 引入一个警告图标，使用 emoji 模拟，保持简洁 */
.icon-warning::before {
  content: "🚧"; /* 施工或警告标志 */
}

/* 媒体查询保持响应式一致性 */
@media (max-width: 768px) {
  .error-container {
    margin: 30px auto;
    padding: 20px 3%;
  }

  .error-header h1 {
    font-size: 28px;
  }

  .error-card {
    padding: 30px;
  }
}
</style>