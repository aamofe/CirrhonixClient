<template>
  <div class="crawler-page page-bg">
    <PageHero
      title="文献爬虫管理"
      subtitle="从学术资源库抓取最新的肝脏研究文献"
    />

    <div class="page-container">
      <div class="content-layout">
        <SideNav
          :items="navItems"
          :active-section="activeSection"
          variant="standalone"
          @change="setActiveSection"
        />

        <div class="crawler-main">
          <div v-if="activeSection === 'manual'" class="content-panel">
            <ManualCrawler :availableSources="availableSources" />
          </div>
          <div v-if="activeSection === 'auto'" class="content-panel">
            <AutoCrawler :availableSources="availableSources" />
          </div>
          <div v-if="activeSection === 'upload'" class="content-panel">
            <UploadPaper />
          </div>
          <div v-if="activeSection === 'history'" class="content-panel">
            <CrawlerHistory />
          </div>
        </div>
      </div>
    </div>
    <SiteFooter />
  </div>
</template>

<script>
import SiteFooter from '@/components/navigation/SiteFooter.vue'
import PageHero from '@/components/ui/PageHero.vue'
import SideNav from '@/components/ui/SideNav.vue'
import ManualCrawler from '@/components/crawl/ManualCrawler.vue'
import AutoCrawler from '@/components/crawl/AutoCrawler.vue'
import CrawlerHistory from '@/components/crawl/CrawlerHistory.vue'
import UploadPaper from '@/components/crawl/UploadPaper.vue'
import Crawler from '@/api/Crawler'

import {
  Search as SearchIcon,
  Timer as TimerIcon,
  Upload as UploadIcon,
  Document as DocumentIcon,
} from '@element-plus/icons-vue'

export default {
  name: 'CrawlerView',
  components: {
    SiteFooter,
    PageHero,
    SideNav,
    ManualCrawler,
    AutoCrawler,
    CrawlerHistory,
    UploadPaper,
    SearchIcon,
    TimerIcon,
    UploadIcon,
    DocumentIcon,
  },
  data() {
    return {
      activeSection: this.getSavedSection(),
      navItems: [
        { id: 'manual', label: '手动爬取', icon: 'SearchIcon' },
        { id: 'auto', label: '自动爬取', icon: 'TimerIcon' },
        { id: 'upload', label: '上传PDF', icon: 'UploadIcon' },
        { id: 'history', label: '历史记录', icon: 'DocumentIcon' },
      ],
      availableSources: [],
      isLoading: true,
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
          this.$message.error('获取数据源列表返回的数据格式有误')
        }
      } catch (error) {
        this.$message.error('获取数据源列表失败')
      } finally {
        this.isLoading = false
      }
    },

    setActiveSection(sectionId) {
      this.activeSection = sectionId
      sessionStorage.setItem('crawlerActiveSection', sectionId)
    },

    getSavedSection() {
      const savedSection = sessionStorage.getItem('crawlerActiveSection')
      return savedSection || 'manual'
    },
  },
  created() {
    this.fetchDataSources()
    const urlParams = new URLSearchParams(window.location.search)
    const sectionParam = urlParams.get('section')
    if (
      sectionParam &&
      this.navItems.some((item) => item.id === sectionParam)
    ) {
      this.setActiveSection(sectionParam)
    }
  },
}
</script>

<style scoped>
.page-container {
  margin-top: 30px;
  margin-bottom: 30px;
}

.crawler-main {
  flex: 1;
}
</style>
