<!-- src/views/CrawlerPage.vue -->
<template>
  <div class="crawler-page">
    <div class="container">
      <SectionTitle title="文献爬虫管理" subtitle="从学术资源库抓取最新的肝脏研究文献" />

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
import SiteFooter from "@/components/layout/SiteFooter.vue"
import SectionTitle from "@/components/common/Sectiontitle.vue"
// 导入拆分后的爬虫组件
import ManualCrawler from "@/components/crawl/ManualCrawler.vue"
import AutoCrawler from "@/components/crawl/AutoCrawler.vue"
import CrawlerHistory from "@/components/crawl/CrawlerHistory.vue"
import UploadPaper from "@/components/crawl/UploadPaper.vue"

// 导入爬虫API
import Crawler from "@/api/Crawler"

// Element Plus 图标 - 请确保这些图标已在您的项目中导入
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
    SectionTitle,
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
      // 初始化为空数组而不是null，这样即使API调用失败也能保持组件渲染
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
          // 确保数据是数组格式
          this.availableSources = Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data]

          console.log("成功获取数据源:", this.availableSources)
        } else {
          console.error("API返回的数据结构不符合预期:", response)
          this.$message.error("获取数据源列表返回的数据格式有误")
        }
      } catch (error) {
        console.error("获取数据源列表失败", error)
        this.$message.error("获取数据源列表失败")
      } finally {
        this.isLoading = false
      }
    },

    // 设置当前活跃标签并保存到sessionStorage
    setActiveSection(sectionId) {
      this.activeSection = sectionId
      sessionStorage.setItem("crawlerActiveSection", sectionId)
    },

    // 从sessionStorage获取上次保存的标签ID
    getSavedSection() {
      const savedSection = sessionStorage.getItem("crawlerActiveSection")
      return savedSection || "manual" // 如果没有保存过，默认为'manual'
    }
  },
  created() {
    // 先加载数据源
    this.fetchDataSources()

    // 检查URL参数中是否指定了特定的部分
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
  background-color: #f9f9f9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.crawler-content {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

.crawler-sidebar {
  width: 200px;
  flex-shrink: 0;
}

.crawler-main {
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.nav-item:hover {
  background-color: #f0f7ff;
}

.nav-item.active {
  background-color: #1a91c1;
  color: white;
}

.nav-icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.crawler-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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
    padding: 10px;
    margin-bottom: 5px;
  }
}
</style>