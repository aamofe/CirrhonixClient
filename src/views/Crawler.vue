<!-- src/views/CrawlerPage.vue -->
<template>
  <div class="crawler-page">
    <div class="container">
      <SectionTitle
        title="文献爬虫管理"
        subtitle="从学术资源库抓取最新的肝脏研究文献"
      />

      <div class="crawler-content">
        <!-- 手动爬取组件 -->
        <ManualCrawler />

        <!-- 自动爬取组件 -->
        <AutoCrawler />

        <!-- 上传PDF组件 -->
        <UploadPaper />

        <!-- 爬取历史记录组件 -->
        <CrawlerHistory />
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<script>
import SiteFooter from "@/components/layout/SiteFooter.vue";
import SectionTitle from "@/components/common/Sectiontitle.vue";

// 导入拆分后的爬虫组件
import ManualCrawler from "@/components/crawl/ManualCrawler.vue";
import AutoCrawler from "@/components/crawl/AutoCrawler.vue";
import CrawlerHistory from "@/components/crawl/CrawlerHistory.vue";
import UploadPaper from "@/components/crawl/UploadPaper.vue";

export default {
  name: "CrawlerView",
  components: {
    SiteFooter,
    SectionTitle,
    ManualCrawler,
    AutoCrawler,
    CrawlerHistory,
    UploadPaper,
  },
};
</script>

<style scoped>
.crawler-page {
  min-height: 100vh;
  background-color: #f5fbff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.crawler-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
}
</style>
