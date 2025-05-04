<!-- src/components/SiteFooter.vue -->
<template>
  <footer>
    <div class="footer-content">
      <div class="footer-section">
        <h3>LiverScholar</h3>
        <ul>
          <li><router-link to="/about">关于我们</router-link></li>
          <li><router-link to="/contact">联系方式</router-link></li>
          <li><router-link to="/partner">合作伙伴</router-link></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>帮助</h3>
        <ul>
          <li><router-link to="/guide">使用指南</router-link></li>
          <li><router-link to="/faq">常见问题</router-link></li>
          <li><router-link to="/feedback">反馈建议</router-link></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>资源</h3>
        <ul>
          <li><router-link to="/literature">文献资源</router-link></li>
          <li><router-link to="/knowledge-graph">知识图谱</router-link></li>
          <li><router-link to="/expert-consensus">专家共识</router-link></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>账户</h3>
        <ul>
          <li><router-link to="/profile">个人中心</router-link></li>
          <li><router-link to="/settings">账户设置</router-link></li>
          <li><router-link to="/privacy">隐私政策</router-link></li>
        </ul>
      </div>
    </div>

    <div class="copyright">
      <p>© {{ currentYear }} LiverScholar 肝硬化文献智能检索系统 - 版权所有</p>
    </div>
  </footer>
</template>

<script>
export default {
  name: "SiteFooter",
  computed: {
    currentYear() {
      return new Date().getFullYear();
    },
  },
};
</script>

<style scoped>
footer {
  background-color: #1a91c1;
  color: white;
  padding: 40px 5%;
  margin-top: 60px;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 30px;
}

.footer-section {
  flex: 1;
  min-width: 200px;
}

.footer-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  font-weight: 500;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section ul li {
  margin-bottom: 10px;
}

.footer-section ul li a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-section ul li a:hover {
  color: white;
  text-decoration: underline;
}

.copyright {
  text-align: center;
  padding-top: 30px;
  margin-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 20px;
  }

  .footer-section {
    min-width: 100%;
  }
}
</style>
