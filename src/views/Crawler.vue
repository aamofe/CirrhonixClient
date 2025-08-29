<!-- src/views/CrawlerPage.vue -->
<template>
  <div class="crawler-page">
    <!-- 参考 LiteratureListPage 的头部样式 -->
    <section class="crawler-header">
      <h1>文献爬虫管理</h1>
      <p>从学术资源库抓取最新的肝脏研究文献</p>
    </section>

    <div class="container">
      <div class="crawler-content">
        <!-- 左侧导航 -->
        <div class="crawler-sidebar">
          <nav>
            <div v-for="(item, index) in navItems" :key="index" @click="setActiveSection(item.id)"
              :class="['nav-item', activeSection === item.id ? 'active' : '']">
              <span class="nav-icon">
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
              </span>
              <span>{{ item.label }}</span>
            </div>
          </nav>
        </div>

        <!-- 右侧内容 -->
        <div class="crawler-main">
          <!-- 手动爬取 -->
          <div v-if="activeSection === 'manual'" class="crawler-section">
            <ManualCrawler :availableSources="availableSources" />
          </div>

          <!-- 自动爬取 -->
          <div v-if="activeSection === 'auto'" class="crawler-section">
            <AutoCrawler :availableSources="availableSources" />
          </div>

          <!-- 上传PDF -->
          <div v-if="activeSection === 'upload'" class="crawler-section">
            <UploadPaper />
          </div>

          <!-- 爬取历史记录 -->
          <div v-if="activeSection === 'history'" class="crawler-section">
            <CrawlerHistory />
          </div>
        </div>
      </div>
    </div>
    <SiteFooter />
  </div>
</template>

<script>
import SiteFooter from "@/components/navigation/SiteFooter.vue"

import ManualCrawler from "@/components/crawl/ManualCrawler.vue"
import AutoCrawler from "@/components/crawl/AutoCrawler.vue"
import CrawlerHistory from "@/components/crawl/CrawlerHistory.vue"
import UploadPaper from "@/components/crawl/UploadPaper.vue"

import Crawler from "@/api/Crawler"

import {
  Search as SearchIcon,
  Timer as TimerIcon,
  Upload as UploadIcon,
  Document as DocumentIcon
} from "@element-plus/icons-vue"

export default {
  name: "CrawlerView",
  components: {
    SiteFooter,
    ManualCrawler,
    AutoCrawler,
    CrawlerHistory,
    UploadPaper,
    SearchIcon,
    TimerIcon,
    UploadIcon,
    DocumentIcon
  },
  data() {
    return {
      activeSection: this.getSavedSection(),
      navItems: [
        { id: "manual", label: "手动爬取", icon: "SearchIcon" },
        { id: "auto", label: "自动爬取", icon: "TimerIcon" },
        { id: "upload", label: "上传PDF", icon: "UploadIcon" },
        { id: "history", label: "历史记录", icon: "DocumentIcon" }
      ],

      availableSources: [],
      isLoading: true
    }
  },
  methods: {
    async fetchDataSources() {
      this.isLoading = true
      try {
        const response = await Crawler.getSourceList()
        if (response.data && response.data.data) {
          this.availableSources = Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data]
        } else {
          this.$message.error("获取数据源列表返回的数据格式有误")
        }
      } catch (error) {
        this.$message.error("获取数据源列表失败")
      } finally {
        this.isLoading = false
      }
    },

    setActiveSection(sectionId) {
      this.activeSection = sectionId
      sessionStorage.setItem("crawlerActiveSection", sectionId)
    },

    getSavedSection() {
      const savedSection = sessionStorage.getItem("crawlerActiveSection")
      return savedSection || "manual"
    }
  },
  created() {
    this.fetchDataSources()
    const urlParams = new URLSearchParams(window.location.search)
    const sectionParam = urlParams.get("section")
    if (
      sectionParam &&
      this.navItems.some((item) => item.id === sectionParam)
    ) {
      this.setActiveSection(sectionParam)
    }
  }
}
</script>

<style scoped>
.crawler-page {
  min-height: 100vh;
  background-color: #f5fbff;
}

/* 参考 LiteratureListPage 的头部样式 */
.crawler-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 40px 5%;
  text-align: center;
  position: relative;
}

.crawler-header h1 {
  color: white;
  font-size: 28px;
  margin-bottom: 10px;
}

.crawler-header p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.container {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 1rem;
}

.crawler-content {
  display: flex;
  gap: 2rem;
}

.crawler-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem 0;
  height: fit-content;
}

.crawler-main {
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  margin-bottom: 8px;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.3s;
  color: #555;
}

.nav-item:hover {
  background-color: rgba(168, 230, 207, 0.1);
  color: #1a91c1;
}

.nav-item.active {
  background-color: rgba(168, 230, 207, 0.2);
  color: #1a91c1;
  border-left: 3px solid #1a91c1;
}

.nav-icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.crawler-section {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .crawler-content {
    flex-direction: column;
  }

  .crawler-sidebar {
    width: 100%;
  }

  .nav-item {
    padding: 0.75rem 1.25rem;
    margin-bottom: 5px;
  }
}
</style>