<!-- src/views/LiteratureListPage.vue -->
<template>
  <div class="literature-list-page page-bg">
    <PageHero title="文献列表" subtitle="浏览全球范围内与肝硬化相关的最新研究、临床实践与专家共识">
      <search-box :initialQuery="searchQuery" @search="onSearch" />

      <div class="search-results-info" v-if="!isLoading">
        <span>共找到 {{ totalResults }} 条结果</span>
        <div class="sort-options">
          <span>排序: </span>
          <span :class="{ active: sortBy === 'relevance' }" @click="setSortBy('relevance')">
            相关度
          </span>
          <span :class="{ active: sortBy === 'date' }" @click="setSortBy('date')">
            出版日期
          </span>
          <span :class="{ active: sortBy === 'citations' }" @click="setSortBy('citations')">
            引用次数
          </span>
        </div>
      </div>
    </PageHero>

    <div class="literature-content">
      <div class="literature-results">
        <LoadingSpinner v-if="isLoading" text="正在加载文献..." size="lg" />

        <EmptyState v-else-if="results.length === 0" message="抱歉，未找到符合条件的文献。请尝试修改检索词。" />

        <template v-else>
          <literature-card v-for="article in results" :key="article.id" :article="article"
            @view-detail="viewArticleDetail" />

          <Pagination v-if="totalPages > 1" :currentPage="currentPage" :totalPages="totalPages"
            @page-change="changePage" />

        </template>
      </div>
    </div>

    <site-footer />
  </div>
</template>

<script>
import SearchBox from "@/components/navigation/SearchBox.vue"
import SiteFooter from "@/components/navigation/SiteFooter.vue"
import PageHero from "@/components/ui/PageHero.vue"
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue"
import EmptyState from "@/components/ui/EmptyState.vue"
import Literature from "@/api/Literature"
import LiteratureCard from "@/components/literature/LiteratureCard.vue"
import Pagination from "@/components/navigation/Pagination.vue"
export default {
  name: "LiteratureListPage",
  components: {
    SearchBox,
    SiteFooter,
    PageHero,
    LoadingSpinner,
    EmptyState,
    LiteratureCard,
    Pagination,
  },
  data() {
    return {
      searchQuery: "",
      isLoading: false,
      results: [],
      totalResults: 0,
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      sortBy: "relevance",

      hasListState: false,
    }
  },
  computed: {

  },
  created() {
    this.parseQueryParams()
  },
  methods: {
    clearListState() {
      sessionStorage.removeItem("literatureListState")
      this.hasListState = false
    },
    saveListState() {
      const listState = {
        searchQuery: this.searchQuery,
        results: this.results,
        totalResults: this.totalResults,
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        sortBy: this.sortBy,
      }
      sessionStorage.setItem("literatureListState", JSON.stringify(listState))
      this.hasListState = true
    },
    restoreListState() {
      const savedState = sessionStorage.getItem("literatureListState")
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          this.searchQuery = state.searchQuery || ""
          this.results = state.results || []
          this.totalResults = state.totalResults || 0
          this.currentPage = state.currentPage || 1
          this.sortBy = state.sortBy || "relevance"
          this.totalPages = Math.ceil(this.totalResults / this.pageSize)
          this.hasListState = true
        } catch (error) {
          this.hasListState = false
        }
      } else {
        this.hasListState = false
      }
    },
    async fetchData() {
      this.isLoading = true
      try {
        let response
        if (this.searchQuery) {
          response = await Literature.search(
            this.searchQuery,
            this.currentPage,
            this.pageSize,
            this.sortBy
          )
        } else {
          response = await Literature.list({
            page: this.currentPage,
            size: this.pageSize,
            sort_by: this.sortBy
          })
        }

        if (response && response.data && response.data.data) {
          this.results = response.data.data.items || []
          this.totalResults = response.data.data.total || 0
          this.totalPages = Math.ceil(this.totalResults / this.pageSize)
        } else {
          this.results = []
          this.totalResults = 0
          this.totalPages = 1
        }
      } catch (error) {
        console.error("获取文献数据失败:", error)
        if (error.response)
          console.log("错误回答：", error.response)
        this.results = []
        this.totalResults = 0
        this.totalPages = 1
      } finally {
        this.isLoading = false
      }
    },
    onSearch(query) {
      this.currentPage = 1
      this.searchQuery = query
      this.clearListState()
      this.updateUrl()
    },
    updateUrl() {
      const query = { ...this.$route.query }
      if (this.searchQuery) {
        query.q = this.searchQuery
      } else {
        delete query.q
      }
      query.page = this.currentPage
      query.sort_by = this.sortBy
      this.$router.replace({
        query
      }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          throw err
        }
      })
    },
    setSortBy(sort) {
      if (this.sortBy === sort) return
      this.sortBy = sort
      this.currentPage = 1
      this.clearListState()
      this.updateUrl()
    },
    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return
      }
      this.currentPage = page
      this.clearListState()
      this.updateUrl()
      window.scrollTo(0, 0)
    },
    viewArticleDetail(id) {
      this.saveListState()
      this.$router.push({
        name: "literature-detail",
        params: { id },
      })
    },
    parseQueryParams() {
      const query = this.$route.query
      this.searchQuery = query.q || ""
      this.sortBy = query.sort_by || "relevance"
      const page = parseInt(query.page, 10)
      this.currentPage = (!isNaN(page) && page > 0) ? page : 1
      this.fetchData()
    },
  },
  watch: {
    "$route.query"() {
      this.parseQueryParams()
    },
  },
  beforeUnmount() {
    this.saveListState()
  },
}
</script>

<style scoped>
.literature-content {
  max-width: var(--max-width-content);
  margin: 30px auto;
  padding: 0 5%;
}

.literature-results {
  width: 100%;
}

.search-results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  color: white;
  font-size: 14px;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sort-options span {
  cursor: pointer;
}

.sort-options span.active {
  font-weight: 500;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .search-results-info {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .sort-options {
    width: 100%;
    justify-content: space-between;
  }
}
</style>