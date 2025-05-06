<!-- src/views/AboutPage.vue -->
<template>
  <div class="about-container">
    <h1 class="page-title">关于 LiverScholar</h1>

    <div class="section">
      <h2 id="about-us">关于我们</h2>
      <div class="content-box">
        <p>
          LiverScholar
          是一个致力于提供高质量肝硬化文献检索服务的专业平台。我们整合多方数据源，结合人工智能技术，为医学研究者和临床医生提供便捷、精准的肝硬化相关研究文献资源。
        </p>
        <p>
          我们的使命是通过先进的智能检索技术，帮助用户快速获取所需的专业文献，促进肝硬化领域的研究进展与临床实践。
        </p>
      </div>
    </div>

    <div class="section">
      <h2 id="user-guide">使用指南</h2>
      <div class="content-box">
        <h3>1. 文献检索页面</h3>
        <p>
          我们提供强大的条件筛选功能、智能排序算法以及AI总结功能，帮助您快速定位最相关的研究文献。
        </p>

        <h3>2. 文献详情页面</h3>
        <p>
          包含完整文献信息，相关文献推荐，以及便捷的翻译功能，让您更深入地了解研究内容。
        </p>

        <h3>3. 爬虫页面</h3>
        <p>
          支持手动爬取数据和设置自动爬虫间隔。我们的后端系统整合了PubMed、arXiv等多种合规数据源，确保数据的全面性和权威性。
        </p>

        <h3>4. 知识图谱界面</h3>
        <p>
          以树状结构可视化呈现文献之间的多种关联关系，帮助用户发现研究脉络和知识演变，为您的研究提供更广阔的视角。
        </p>

        <h3>5. AI辅助小卡片</h3>
        <p>
          以悬浮的形式停留在每一个页面，提供即时的智能问答服务，随时满足您的疑问和需求。
        </p>
      </div>
    </div>

    <div class="section">
      <h2 id="feedback">反馈建议</h2>
      <div class="content-box">
        <p>我们非常重视用户的反馈和建议，这是我们不断进步的动力。</p>
        <p>
          如有任何问题、建议或合作意向，请联系我们：<a
            href="mailto:aamofe@qq.com"
            >aamofe@qq.com</a
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AboutPage",
};
</script>

<style scoped>
.about-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 2rem;
}

.section {
  margin-bottom: 3rem;
}

.section h2 {
  color: #2c3e50;
  border-bottom: 2px solid #ddd;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.content-box {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.content-box h3 {
  color: #486982;
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
}

.content-box h3:first-child {
  margin-top: 0;
}

.content-box p {
  line-height: 1.6;
  margin-bottom: 1rem;
}

.content-box a {
  color: #42b983;
  text-decoration: none;
  font-weight: 600;
}

.content-box a:hover {
  text-decoration: underline;
}
</style>
