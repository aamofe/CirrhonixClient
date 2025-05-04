<!-- src/views/home.vue -->
<template>
  <div class="home-page">
    <!-- <header-component /> -->

    <section class="search-container">
      <h1>肝硬化文献智能检索系统</h1>
      <p>
        集成全球领先肝病研究资源，通过智能检索技术，为医师和研究人员提供精准专业的学术支持
      </p>

      <search-box @search="onSearch" />

      <div class="advanced-search" @click="goToAdvancedSearch">高级检索</div>
    </section>

    <div class="main-content">
      <section class="featured-article">
        <div class="featured-content">
          <h2>{{ featuredArticle.title }}</h2>
          <div class="featured-meta">
            <span>来源：{{ featuredArticle.journal }}</span>
            <span
              >发表日期：{{ formatDate(featuredArticle.publicationDate) }}</span
            >
            <span>引用：{{ featuredArticle.citations }}</span>
          </div>
          <p>{{ featuredArticle.abstract }}</p>
          <primary-button
            @click="viewArticle(featuredArticle.id)"
            :fullWidth="false"
          >
            阅读全文
          </primary-button>
        </div>
        <div class="featured-image">肝硬化研究图片</div>
      </section>

      <section-title title="研究热点趋势" url="/trends" linkText="查看更多" />

      <section class="chart-section">
        <div class="chart-container">
          <!-- 研究趋势图表将在mounted中初始化 -->
        </div>
      </section>

      <section-title title="最新文献" url="/literature" linkText="查看全部" />

      <div class="card-grid">
        <literature-card
          v-for="article in recentArticles"
          :key="article.id"
          :article="article"
          @click="viewArticle(article.id)"
        />
      </div>

      <section-title title="热门作者" url="/authors" linkText="查看更多" />

      <div class="card-grid">
        <author-card
          v-for="author in popularAuthors"
          :key="author.id"
          :author="author"
          @click="viewAuthorProfile(author.id)"
        />
      </div>
    </div>

    <site-footer />
  </div>
</template>

<script>
// import HeaderComponent from "@/components/layout/HeaderComponent.vue"
import SearchBox from "@/components/common/SearchBox.vue";
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";
import SectionTitle from "@/components/common/Sectiontitle.vue";
import LiteratureCard from "@/components/cards/LiteratureCard.vue";
import AuthorCard from "@/components/cards/AuthorCard.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import Literature from "@/api/Literature";
import Search from "@/api/Search";

export default {
  name: "HomeView",
  components: {
    // HeaderComponent,
    SearchBox,
    PrimaryButton,
    SectionTitle,
    LiteratureCard,
    AuthorCard,
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
      trendingTopics: [],
      isLoading: false,
    };
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("zh-CN");
    },
    async loadRecentArticles() {
      try {
        this.isLoading = true;
        const response = await Literature.list({
          sort: "-publication_date",
          page: 1,
          size: 6,
        });
        this.recentArticles = response.data.items || [];
      } catch (error) {
        console.error("Failed to load recent articles", error);
      } finally {
        this.isLoading = false;
      }
    },
    async loadPopularAuthors() {
      try {
        this.isLoading = true;
        const response = await Literature.getAuthors({
          sort: "publications",
          page: 1,
          size: 6,
        });
        this.popularAuthors = response.data.items || [];
      } catch (error) {
        console.error("Failed to load popular authors", error);
      } finally {
        this.isLoading = false;
      }
    },
    async loadFeaturedArticle() {
      try {
        // 这里可以通过特定接口获取精选文章，或者从最新文章中选择第一篇
        const response = await Literature.list({
          sort: "-citations",
          page: 1,
          size: 1,
        });

        if (response.data.items && response.data.items.length > 0) {
          const article = response.data.items[0];
          this.featuredArticle = {
            id: article.id,
            title: article.title,
            journal: article.journal?.name || "Unknown Journal",
            publicationDate: article.publication_date,
            citations: article.citation_count || 0,
            abstract: article.abstract || "暂无摘要",
          };
        }
      } catch (error) {
        console.error("Failed to load featured article", error);
      }
    },
    async loadTrendingTopics() {
      try {
        const response = await Search.getKeywords({
          sort: "-weight",
          page: 1,
          size: 10,
        });
        this.trendingTopics = response.data.items || [];

        // 如果有趋势数据，在这里初始化图表
        if (this.trendingTopics.length > 0) {
          this.initTrendChart();
        }
      } catch (error) {
        console.error("Failed to load trending topics", error);
      }
    },
    initTrendChart() {
      // 这里可以使用 Chart.js 或其他图表库初始化研究趋势图表
      // 如果需要，可以创建一个专门的图表组件
    },
    onSearch(query) {
      this.$router.push({ path: "/search", query: { q: query } });
    },
    goToAdvancedSearch() {
      this.$router.push("/search/advanced");
    },
    viewArticle(id) {
      if (id) {
        this.$router.push(`/literature/${id}`);
      }
    },
    viewAuthorProfile(id) {
      this.$router.push(`/authors/${id}`);
    },
  },
  async mounted() {
    try {
      // 并行加载所有数据
      await Promise.all([
        this.loadRecentArticles(),
        this.loadPopularAuthors(),
        this.loadFeaturedArticle(),
        this.loadTrendingTopics(),
      ]);
    } catch (error) {
      console.error("Error initializing home page", error);
    }
  },
};
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
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  border-radius: 50%;
}

.search-container::after {
  content: "";
  position: absolute;
  bottom: -30px;
  left: 10%;
  width: 150px;
  height: 150px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0) 70%
  );
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

.advanced-search {
  color: white;
  margin-top: 15px;
  text-decoration: underline;
  cursor: pointer;
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
  background-color: #f5fbff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a91c1;
  font-weight: 500;
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
  color: #888;
  font-size: 14px;
  margin-bottom: 20px;
}

.featured-meta span {
  margin-right: 20px;
  display: flex;
  align-items: center;
}

.chart-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 25px;
  margin-bottom: 40px;
}

.chart-container {
  height: 300px;
  margin-top: 20px;
  background: linear-gradient(
    180deg,
    rgba(26, 145, 193, 0.1) 0%,
    rgba(168, 230, 207, 0.1) 100%
  );
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.chart-container::before {
  content: "研究趋势图表";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #1a91c1;
  font-size: 18px;
  opacity: 0.7;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
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
}
</style>
