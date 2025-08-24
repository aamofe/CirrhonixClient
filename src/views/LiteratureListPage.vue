<!-- src/views/LiteratureListPage.vue -->
<template>
  <div class="literature-list-page">
    <section class="list-header">
      <h1>文献列表</h1>
      <p>浏览全球范围内与肝硬化相关的最新研究、临床实践与专家共识</p>

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
    </section>

    <div class="literature-content">
      <div class="literature-results">
        <div class="loading" v-if="isLoading">
          <div class="spinner"></div>
          <p>正在加载文献...</p>
        </div>

        <div v-else-if="results.length === 0" class="no-results">
          <p>抱歉，未找到符合条件的文献。</p>
          <p>请尝试修改检索词。</p>
        </div>

        <template v-else>
          <literature-item v-for="article in results" :key="article.id" :article="article"
            @view-detail="viewArticleDetail" />

          <div class="pagination">
            <span class="page-btn" :class="{ disabled: currentPage === 1 }" @click="changePage(currentPage - 1)">
              上一页
            </span>

            <template v-for="page in displayedPages" :key="page">
              <span v-if="page === '...'" class="page-ellipsis"> ... </span>
              <span v-else class="page-number" :class="{ active: page === currentPage }" @click="changePage(page)">
                {{ page }}
              </span>
            </template>

            <span class="page-btn" :class="{ disabled: currentPage === totalPages }"
              @click="changePage(currentPage + 1)">
              下一页
            </span>
          </div>
        </template>
      </div>
    </div>

    <site-footer />
  </div>
</template>

<script>
import SearchBox from "@/components/common/SearchBox.vue"
import SiteFooter from "@/components/layout/SiteFooter.vue"
import Literature from "@/api/Literature"
import LiteratureItem from "@/components/layout/LiteratureItem.vue"

export default {
  name: "LiteratureListPage",
  components: {
    SearchBox,
    SiteFooter,
    LiteratureItem,
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
    displayedPages() {
      const pages = []
      if (this.totalPages <= 7) {
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)

        if (this.currentPage > 3) {
          pages.push("...")
        }

        const start = Math.max(2, this.currentPage - 1)
        const end = Math.min(this.totalPages - 1, this.currentPage + 1)

        for (let i = start; i <= end; i++) {
          pages.push(i)
        }

        if (this.currentPage < this.totalPages - 2) {
          pages.push("...")
        }

        pages.push(this.totalPages)
      }
      return pages
    },
  },
  created() {
    console.log('=== LiteratureListPage created ===')
    console.log('当前路由查询参数:', this.$route.query)

    const urlQuery = this.$route.query.q
    console.log('URL中的q参数:', urlQuery)

    if (urlQuery !== undefined) {
      console.log('检测到URL查询参数')
      this.searchQuery = urlQuery
      if (urlQuery) {
        console.log('执行搜索:', urlQuery)
        this.searchLiterature()
      } else {
        console.log('空查询，加载所有文献')
        this.loadAllLiterature()
      }
      return
    }

    console.log('没有URL查询参数，尝试恢复状态')
    this.restoreListState()
    console.log('恢复状态后 hasListState:', this.hasListState)

    // 修改这里：即使有缓存状态，如果结果为空也要重新加载
    if (!this.hasListState || this.results.length === 0) {
      console.log('需要加载文献数据')
      this.loadAllLiterature()
    } else {
      console.log('使用缓存数据，共', this.results.length, '条')
    }
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


          this.totalPages = Math.ceil(this.results.length / this.pageSize)

          this.hasListState = true
        } catch (error) {

          this.hasListState = false
        }
      } else {
        this.hasListState = false
      }
    },

    async loadAllLiterature() {
      this.isLoading = true

      try {
        const response = await Literature.list({
          page: this.currentPage,
          size: this.pageSize,
          sort_by: this.sortBy
        })
        if (response && response.data) {
          this.results = response?.data?.data?.items || []
          this.totalResults = response?.data?.data?.total || 0
          this.totalPages = Math.ceil(this.totalResults / this.pageSize)
        } else {

          this.results = []
          this.totalResults = 0
          this.totalPages = 1
        }
      } catch (error) {

        this.results = []
        this.totalResults = 0
        this.totalPages = 1
      } finally {
        this.isLoading = false
      }
    },

    async onSearch(query) {

      this.currentPage = 1


      this.searchQuery = query


      this.clearListState()

      if (!query) {

        await this.loadAllLiterature()


        this.updateUrl()
      } else {

        await this.searchLiterature()


        this.updateUrl()
      }


      this.saveListState()
    },

    async searchLiterature() {
      this.isLoading = true

      try {

        const response = await Literature.search(
          this.searchQuery,
          this.currentPage,
          this.pageSize,
          this.sortBy
        )

        if (response && response.data) {
          this.results = response?.data?.data?.items || []
          this.totalResults = response?.data?.data?.total || 0
          this.totalPages = Math.ceil(this.totalResults / this.pageSize)
        } else {

          this.results = []
          this.totalResults = 0
          this.totalPages = 1
        }
      } catch (error) {

        this.results = []
        this.totalResults = 0
        this.totalPages = 1
      } finally {
        this.isLoading = false
      }
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


      if (this.searchQuery) {
        this.searchLiterature()
      } else {
        this.loadAllLiterature()
      }


      this.updateUrl()


      this.saveListState()
    },

    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return
      }

      this.currentPage = page


      this.updateUrl()


      if (this.searchQuery) {
        this.searchLiterature()
      } else {
        this.loadAllLiterature()
      }


      this.saveListState()


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

      if (this.hasListState && !query.q && !query.page && !query.sort_by) {
        return
      }

      if (query.q !== undefined) {
        this.searchQuery = query.q || ""
      }

      if (query.sort_by) {
        this.sortBy = query.sort_by
      }

      if (query.page) {
        const page = parseInt(query.page, 10)
        if (!isNaN(page) && page > 0) {
          this.currentPage = page
        }
      }


      if (this.searchQuery) {
        this.searchLiterature()
      } else {
        this.loadAllLiterature()
      }
    },
  },
  mounted() {
    this.parseQueryParams()
  },
  watch: {
    "$route.query"(newQuery) {
      this.parseQueryParams()
    },
  },
  beforeUnmount() {

    this.saveListState()
  },
}
</script>

<style scoped>
.literature-list-page {
  background-color: #f5fbff;
  min-height: 100vh;
}

.list-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 40px 5%;
  text-align: center;
  position: relative;
}

.list-header h1 {
  color: white;
  font-size: 28px;
  margin-bottom: 10px;
}

.list-header p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
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

.literature-content {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 5%;
}

.literature-results {
  width: 100%;
}

.loading {
  text-align: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(26, 145, 193, 0.3);
  border-radius: 50%;
  border-top-color: #1a91c1;
  margin: 0 auto 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-results {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  gap: 5px;
}

.page-btn,
.page-number,
.page-ellipsis {
  min-width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.page-number {
  color: #666;
}

.page-number.active {
  background: #1a91c1;
  color: white;
}

.page-btn {
  padding: 0 10px;
  color: #1a91c1;
}

.page-btn.disabled {
  color: #ccc;
  cursor: not-allowed;
}

.page-ellipsis {
  cursor: default;
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