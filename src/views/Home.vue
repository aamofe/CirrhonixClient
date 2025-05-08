<!-- src/views/home.vue -->
<template>
  <div class="home-page">
    <section class="search-container">
      <h1>肝硬化文献智能检索系统</h1>
      <p>
        集成全球领先肝病研究资源，通过智能检索技术，为医师和研究人员提供精准专业的学术支持
      </p>

      <search-box @search="onSearch" />
    </section>

    <div class="main-content">
      <!-- 精选文献 -->
      <section class="featured-article">
        <div class="featured-content">
          <h2>{{ featuredArticle.title }}</h2>
          <div class="featured-meta">
            <span>来源：{{ featuredArticle.journal }}</span>
            <span>发表日期：{{ formatDate(featuredArticle.publicationDate) }}</span>
            <span>引用：{{ featuredArticle.citations }}</span>
          </div>
          <p>{{ featuredArticle.abstract }}</p>
          <primary-button @click="viewArticle(featuredArticle.id)" :fullWidth="false">
            阅读全文
          </primary-button>
        </div>
        <div class="featured-image">
          <img src="@/assets/cover.avif" alt="肝硬化研究图片" />
        </div>
      </section>

      <!-- AI助手 -->
      <AiAssistant />

      <!-- 研究热点 -->
      <section class="hot-topics">
        <h2 class="section-header">肝硬化研究热点</h2>
        <div class="topics-grid">
          <div v-for="(topic, index) in researchTopics" :key="index" class="topic-card"
            @click="onSearch(topic.keyword)">
            <div class="topic-icon">
              <i :class="topic.icon"></i>
            </div>
            <h3>{{ topic.title }}</h3>
            <p>{{ topic.description }}</p>
          </div>
        </div>
      </section>

      <!-- 研究统计 -->
      <section class="research-stats">
        <h2 class="section-header">肝硬化研究统计</h2>
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-number">{{ researchStats.totalArticles }}</div>
            <div class="stat-label">收录文献</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ researchStats.totalAuthors }}</div>
            <div class="stat-label">研究作者</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ researchStats.totalJournals }}</div>
            <div class="stat-label">期刊来源</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ researchStats.lastUpdate }}</div>
            <div class="stat-label">最近更新</div>
          </div>
        </div>
      </section>

      <!-- 最新文献 -->
      <div class="content-sections">
        <section class="section-card">
          <h2 class="section-header">最新文献</h2>
          <div class="card-list">
            <literature-card v-for="article in recentArticles" :key="article.id" :article="article"
              @click="viewArticle(article.id)" />
          </div>
        </section>

        <!-- 知名专家 -->
        <section class="section-card">
          <h2 class="section-header">领域专家</h2>
          <div class="card-list">
            <author-card v-for="author in popularAuthors" :key="author.id" :author="author"
              @click="viewAuthorProfile(author.id)" />
          </div>
        </section>
      </div>

      <!-- 语义分析 -->
      <section class="semantic-analysis">
        <h2 class="section-header">热门研究概念网络</h2>
        <div class="concept-network">
          <div class="network-placeholder">
            <p>肝硬化相关概念图谱</p>
            <primary-button @click="onSearch('肝硬化概念网络')" :fullWidth="false">
              查看详情
            </primary-button>
          </div>
        </div>
      </section>
    </div>

    <site-footer />
  </div>
</template>

<script>
import SearchBox from "@/components/common/SearchBox.vue"
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import LiteratureCard from "@/components/cards/LiteratureCard.vue"
import AuthorCard from "@/components/cards/AuthorCard.vue"
import AiAssistant from "@/components/AiAssistant.vue"
import SiteFooter from "@/components/layout/SiteFooter.vue"
import Literature from "@/api/Literature"
import Search from "@/api/Search"

export default {
  name: "HomeView",
  components: {
    SearchBox,
    PrimaryButton,
    LiteratureCard,
    AuthorCard,
    AiAssistant,
    SiteFooter,
  },
  data() {
    return {
      featuredArticle: {
        id: null,
        title: "最新研究焦点：非酒精性脂肪性肝炎向肝硬化转变的分子机制",
        journal: "Nature",
        publicationDate: "2025-04-28",
        citations: 124,
        abstract:
          "本研究通过多组学分析揭示了NASH患者肝脏中炎症反应与细胞外基质累积的分子调控网络，发现了TGF-β1信号通路在肝纤维化进展中的关键作用，并验证了靶向干预的潜在治疗价值...",
      },
      recentArticles: [],
      popularAuthors: [],
      isLoading: false,
      keywords: [],
      researchTopics: [
        {
          title: "非酒精性脂肪性肝病",
          keyword: "非酒精性脂肪性肝病 肝硬化",
          description: "NAFLD向肝硬化进展的机制与诊断",
          icon: "icon-liver",
        },
        {
          title: "病毒性肝炎",
          keyword: "病毒性肝炎 肝硬化",
          description: "乙肝、丙肝病毒感染导致的肝硬化研究",
          icon: "icon-virus",
        },
        {
          title: "肝硬化并发症",
          keyword: "肝硬化 并发症",
          description: "门静脉高压、腹水、肝性脑病研究",
          icon: "icon-complication",
        },
        {
          title: "治疗进展",
          keyword: "肝硬化 治疗",
          description: "逆转肝纤维化的治疗策略研究",
          icon: "icon-treatment",
        },
      ],
      researchStats: {
        totalArticles: "3,582",
        totalAuthors: "1,245",
        totalJournals: "87",
        lastUpdate: "2025-05-06",
      },
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return ""
      const date = new Date(dateString)
      return date.toLocaleDateString("zh-CN")
    },
    async loadRecentArticles() {
      try {
        this.isLoading = true
        const response = await Literature.list({
          sort: "-publication_date",
          page: 1,
          size: 4,
        })
        this.recentArticles = response.data.items || []
      } catch (error) {
        console.error("Failed to load recent articles", error)
      } finally {
        this.isLoading = false
      }
    },
    async loadPopularAuthors() {
      try {
        this.isLoading = true
        const response = await Literature.getAuthors({
          sort: "publications",
          page: 1,
          size: 4,
        })
        this.popularAuthors = response.data.items || []
      } catch (error) {
        console.error("Failed to load popular authors", error)
      } finally {
        this.isLoading = false
      }
    },
    async loadFeaturedArticle() {
      try {
        const response = await Literature.list({
          sort: "-citation_count",
          page: 1,
          size: 1,
        })

        if (response.data.items && response.data.items.length > 0) {
          const article = response.data.items[0]
          this.featuredArticle = {
            id: article.id,
            title: article.title,
            journal: article.journal?.name || "Unknown Journal",
            publicationDate: article.publication_date,
            citations: article.citation_count || 0,
            abstract: article.abstract || "暂无摘要",
          }
        }
      } catch (error) {
        console.error("Failed to load featured article", error)
      }
    },
    async loadKeywords() {
      try {
        const response = await Search.getKeywords({
          sort: "-weight",
          size: 10,
        })
        this.keywords = response.data.items || []
      } catch (error) {
        console.error("Failed to load keywords", error)
      }
    },
    onSearch(query) {
      this.$router.push({ path: "/search", query: { q: query } })
    },
    viewArticle(id) {
      if (id) {
        this.$router.push(`/literature/${id}`)
      }
    },
    viewAuthorProfile(id) {
      this.$router.push(`/authors/${id}`)
    },
  },
  async mounted() {
    try {
      // 并行加载数据
      await Promise.all([
        this.loadRecentArticles(),
        this.loadPopularAuthors(),
        this.loadFeaturedArticle(),
        this.loadKeywords(),
      ])
    } catch (error) {
      console.error("Error initializing home page", error)
    }
  },
}
</script>

<style scoped>
.home-page {
  background-color: #f5fbff;
  min-height: 100vh;
}

.search-container {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 60px 5%;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.search-container::before {
  content: "";
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(ellipse at center,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
}

.search-container::after {
  content: "";
  position: absolute;
  bottom: -30px;
  left: 10%;
  width: 150px;
  height: 150px;
  background: radial-gradient(ellipse at center,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
}

.search-container h1 {
  color: white;
  font-size: 32px;
  margin-bottom: 15px;
}

.search-container p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 30px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.main-content {
  max-width: 1400px;
  margin: 40px auto;
  padding: 0 5%;
}

.featured-article {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 25px;
  margin-bottom: 40px;
  display: flex;
  gap: 30px;
}

.featured-content {
  flex: 1;
}

.featured-image {
  width: 250px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.featured-image:hover img {
  transform: scale(1.05);
}

.featured-article h2 {
  color: #1a91c1;
  font-size: 22px;
  margin-bottom: 15px;
}

.featured-article p {
  color: #555;
  margin-bottom: 20px;
}

.featured-meta {
  display: flex;
  flex-wrap: wrap;
  color: #888;
  font-size: 14px;
  margin-bottom: 20px;
}

.featured-meta span {
  margin-right: 20px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.section-header {
  color: #1a91c1;
  font-size: 22px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5f1f8;
  position: relative;
}

.section-header::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 80px;
  height: 3px;
  background-color: #1a91c1;
}

/* 研究热点样式 */
.hot-topics {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 25px;
  margin-bottom: 40px;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.topic-card {
  background-color: #f5fbff;
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.topic-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(26, 145, 193, 0.1);
}

.topic-icon {
  color: #1a91c1;
  font-size: 24px;
  margin-bottom: 15px;
}

.topic-card h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 10px;
}

.topic-card p {
  color: #666;
  font-size: 14px;
}

/* 研究统计样式 */
.research-stats {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 25px;
  margin-bottom: 40px;
}

.stats-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 20px;
  flex-basis: calc(25% - 20px);
  min-width: 120px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #1a91c1;
  margin-bottom: 10px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

/* 内容区域 */
.content-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.section-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 25px;
  height: 100%;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 语义分析区域 */
.semantic-analysis {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 25px;
  margin-bottom: 40px;
}

.concept-network {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.network-placeholder {
  text-align: center;
  padding: 20px;
  background-color: #f5fbff;
  border-radius: 10px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.network-placeholder p {
  margin-bottom: 20px;
  color: #666;
}

@media (max-width: 980px) {
  .content-sections {
    grid-template-columns: 1fr;
  }

  .stats-container {
    justify-content: center;
  }

  .stat-item {
    flex-basis: calc(50% - 20px);
  }
}

@media (max-width: 768px) {
  .search-container h1 {
    font-size: 24px;
  }

  .featured-article {
    flex-direction: column;
  }

  .featured-image {
    width: 100%;
    margin-bottom: 20px;
  }

  .topics-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 480px) {
  .stat-item {
    flex-basis: 100%;
  }
}
</style>
