<template>
  <div class="not-found-page page-bg">
    <div class="error-container">
      <PageHero title="404 - 页面未找到" compact />

      <div class="error-card content-panel">
        <div class="card-content">
          <h2>系统升级中，功能暂不存在</h2>
          <p class="message-text">
            您尝试访问的页面或功能当前正在进行升级，暂时无法提供服务。
            我们致力于为您提供更强大的肝硬化文献智能检索能力。
          </p>
          <p class="secondary-message">请尝试返回首页或稍后再试。</p>
          <PrimaryButton @click="$router.push('/')">返回首页</PrimaryButton>
        </div>
      </div>

      <div class="contact-info">
        <p>如有紧急需求，请联系技术支持。</p>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<script>
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import PageHero from '@/components/ui/PageHero.vue'
import SiteFooter from '@/components/navigation/SiteFooter.vue'

export default {
  name: 'NotFoundView',
  components: {
    PrimaryButton,
    PageHero,
    SiteFooter,
  },
}
</script>

<style scoped>
.not-found-page {
  display: flex;
  flex-direction: column;
}

.error-container {
  flex-grow: 1;
  max-width: 800px;
  margin: 50px auto;
  padding: 0 5%;
  text-align: center;
}

.error-card {
  margin-top: 20px;
  padding: 40px;
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
  margin-bottom: 15px;
}

.secondary-message {
  color: var(--color-text-light);
  font-size: 14px;
  margin-bottom: 30px;
}

.contact-info {
  margin-top: 30px;
  color: var(--color-text-light);
  font-size: 13px;
}

@media (max-width: 768px) {
  .error-container {
    margin: 30px auto;
  }

  .error-card {
    padding: 30px;
  }
}
</style>
