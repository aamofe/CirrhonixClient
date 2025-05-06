<!-- src/views/SearchPage.vue -->
<template>
  <div class="search-page">
    <section class="search-header">
      <h1>文献检索</h1>
      <p>精准查找全球范围内与肝硬化相关的最新研究、临床实践与专家共识</p>

      <search-box :initialQuery="searchQuery" @search="onSearch" />

      <div class="search-actions">
        <div class="advanced-search-toggle" @click="toggleAdvancedSearch">
          {{ showAdvancedSearch ? "收起高级检索" : "展开高级检索" }}
        </div>
        <div class="search-type-selector">
          <span
            :class="{ active: searchType === 'basic' }"
            @click="setSearchType('basic')"
          >
            基础检索
          </span>
          <span
            :class="{ active: searchType === 'semantic' }"
            @click="setSearchType('semantic')"
          >
            语义检索
          </span>
        </div>
      </div>

      <div class="advanced-search-panel" v-if="showAdvancedSearch">
        <div class="form-group">
          <label>标题</label>
          <input
            type="text"
            v-model="advancedFilters.title"
            placeholder="在标题中包含..."
          />
        </div>

        <div class="form-group">
          <label>摘要</label>
          <input
            type="text"
            v-model="advancedFilters.abstract"
            placeholder="在摘要中包含..."
          />
        </div>

        <div class="form-group">
          <label>作者</label>
          <input
            type="text"
            v-model="advancedFilters.author"
            placeholder="作者姓名..."
          />
        </div>

        <div class="form-group">
          <label>期刊</label>
          <input
            type="text"
            v-model="advancedFilters.journal"
            placeholder="期刊名称..."
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>出版日期</label>
            <div class="date-inputs">
              <input type="date" v-model="advancedFilters.start_date" />
              <span>至</span>
              <input type="date" v-model="advancedFilters.end_date" />
            </div>
          </div>

          <div class="form-group">
            <label>文献类型</label>
            <select v-model="advancedFilters.type">
              <option value="">全部类型</option>
              <option value="article">研究文章</option>
              <option value="review">综述</option>
              <option value="meta">Meta分析</option>
              <option value="clinical">临床试验</option>
              <option value="case">病例报告</option>
            </select>
          </div>

          <div class="form-group">
            <label>语言</label>
            <select v-model="advancedFilters.language">
              <option value="">全部语言</option>
              <option value="zh-CN">中文</option>
              <option value="en">英文</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <primary-button @click="onAdvancedSearch">检索</primary-button>
          <button class="btn-reset" @click="resetAdvancedFilters">重置</button>
        </div>
      </div>
    </section>

    <div class="search-content">
      <div class="search-sidebar">
        <div class="filter-section">
          <h3>筛选结果</h3>

          <div class="filter-group">
            <h4>文献类型</h4>
            <div
              v-for="(count, type) in filters.types"
              :key="type"
              class="filter-item"
            >
              <label>
                <input
                  type="checkbox"
                  :value="type"
                  v-model="selectedFilters.types"
                  @change="applyFilters"
                />
                {{ type }} ({{ count }})
              </label>
            </div>
          </div>

          <div class="filter-group">
            <h4>期刊</h4>
            <div
              v-for="(count, journal) in filters.journals"
              :key="journal"
              class="filter-item"
            >
              <label>
                <input
                  type="checkbox"
                  :value="journal"
                  v-model="selectedFilters.journals"
                  @change="applyFilters"
                />
                {{ journal }} ({{ count }})
              </label>
            </div>
          </div>

          <div class="filter-group">
            <h4>出版年份</h4>
            <div
              v-for="(count, year) in filters.years"
              :key="year"
              class="filter-item"
            >
              <label>
                <input
                  type="checkbox"
                  :value="year"
                  v-model="selectedFilters.years"
                  @change="applyFilters"
                />
                {{ year }} ({{ count }})
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="search-results">
        <div class="search-info" v-if="!isLoading">
          <span>共找到 {{ totalResults }} 条结果</span>
          <div class="sort-options">
            <span>排序: </span>
            <span
              :class="{ active: sortBy === 'relevance' }"
              @click="setSortBy('relevance')"
            >
              相关度
            </span>
            <span
              :class="{ active: sortBy === 'date' }"
              @click="setSortBy('date')"
            >
              出版日期
            </span>
            <span
              :class="{ active: sortBy === 'citations' }"
              @click="setSortBy('citations')"
            >
              引用次数
            </span>
          </div>
        </div>

        <div class="loading" v-if="isLoading">
          <div class="spinner"></div>
          <p>正在检索文献...</p>
        </div>

        <div v-else-if="results.length === 0" class="no-results">
          <p>抱歉，未找到符合条件的文献。</p>
          <p>请尝试修改检索词或筛选条件。</p>
        </div>

        <template v-else>
          <literature-item
            v-for="article in results"
            :key="article.id"
            :article="article"
            @view-detail="viewArticleDetail"
          />

          <div class="pagination">
            <span
              class="page-btn"
              :class="{ disabled: currentPage === 1 }"
              @click="changePage(currentPage - 1)"
            >
              上一页
            </span>

            <template v-for="page in displayedPages" :key="page">
              <span v-if="page === '...'" class="page-ellipsis"> ... </span>
              <span
                v-else
                class="page-number"
                :class="{ active: page === currentPage }"
                @click="changePage(page)"
              >
                {{ page }}
              </span>
            </template>

            <span
              class="page-btn"
              :class="{ disabled: currentPage === totalPages }"
              @click="changePage(currentPage + 1)"
            >
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
import SearchBox from "@/components/common/SearchBox.vue";
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import Search from "@/api/Search";
import LiteratureItem from "@/components/LiteratureItem.vue";

export default {
  name: "SearchView",
  components: {
    SearchBox,
    PrimaryButton,
    SiteFooter,
    LiteratureItem,
  },
  data() {
    return {
      searchQuery: "",
      searchType: "basic",
      showAdvancedSearch: false,
      advancedFilters: {
        title: "",
        abstract: "",
        author: "",
        journal: "",
        start_date: "",
        end_date: "",
        type: "",
        language: "",
      },
      isLoading: false,
      results: [],
      totalResults: 0,
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      sortBy: "relevance",
      filters: {
        types: {},
        journals: {},
        years: {},
      },
      selectedFilters: {
        types: [],
        journals: [],
        years: [],
      },
      // 添加一个标志来追踪是否有保存的搜索状态
      hasSearchState: false,
    };
  },
  computed: {
    displayedPages() {
      const pages = [];
      if (this.totalPages <= 7) {
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);

        if (this.currentPage > 3) {
          pages.push("...");
        }

        const start = Math.max(2, this.currentPage - 1);
        const end = Math.min(this.totalPages - 1, this.currentPage + 1);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (this.currentPage < this.totalPages - 2) {
          pages.push("...");
        }

        pages.push(this.totalPages);
      }
      return pages;
    },
  },
  created() {
    // 从 sessionStorage 恢复状态（如果有）
    this.restoreSearchState();
  },
  methods: {
    // 保存搜索状态到 sessionStorage
    saveSearchState() {
      // 只有在有实际搜索结果时才保存状态
      if (
        this.results.length > 0 ||
        this.searchQuery ||
        Object.values(this.advancedFilters).some((val) => val)
      ) {
        const searchState = {
          searchQuery: this.searchQuery,
          searchType: this.searchType,
          advancedFilters: this.advancedFilters,
          results: this.results,
          totalResults: this.totalResults,
          currentPage: this.currentPage,
          totalPages: this.totalPages,
          sortBy: this.sortBy,
          filters: this.filters,
          selectedFilters: this.selectedFilters,
          showAdvancedSearch: this.showAdvancedSearch,
        };

        sessionStorage.setItem("searchState", JSON.stringify(searchState));
        this.hasSearchState = true;
      }
    },

    // 从 sessionStorage 恢复搜索状态
    restoreSearchState() {
      const savedState = sessionStorage.getItem("searchState");

      if (savedState) {
        try {
          const state = JSON.parse(savedState);

          // 恢复搜索状态
          this.searchQuery = state.searchQuery || "";
          this.searchType = state.searchType || "basic";
          this.advancedFilters =
            state.advancedFilters || this.getDefaultAdvancedFilters();
          this.results = state.results || [];
          this.totalResults = state.totalResults || 0;
          this.currentPage = state.currentPage || 1;
          this.totalPages = state.totalPages || 1;
          this.sortBy = state.sortBy || "relevance";
          this.filters = state.filters || {
            types: {},
            journals: {},
            years: {},
          };
          this.selectedFilters = state.selectedFilters || {
            types: [],
            journals: [],
            years: [],
          };
          this.showAdvancedSearch = state.showAdvancedSearch || false;

          this.hasSearchState = true;
        } catch (error) {
          console.error("Error restoring search state:", error);
          this.hasSearchState = false;
        }
      } else {
        this.hasSearchState = false;
      }
    },

    // 获取默认的高级筛选器状态
    getDefaultAdvancedFilters() {
      return {
        title: "",
        abstract: "",
        author: "",
        journal: "",
        start_date: "",
        end_date: "",
        type: "",
        language: "",
      };
    },

    async onSearch(query) {
      this.searchQuery = query;
      this.currentPage = 1;
      await this.loadResults();
      this.saveSearchState();
    },

    async onAdvancedSearch() {
      this.currentPage = 1;
      await this.loadResults(true);
      this.saveSearchState();
    },

    resetAdvancedFilters() {
      this.advancedFilters = this.getDefaultAdvancedFilters();
    },

    toggleAdvancedSearch() {
      this.showAdvancedSearch = !this.showAdvancedSearch;
      this.saveSearchState();
    },

    async setSearchType(type) {
      this.searchType = type;
      if (this.searchQuery) {
        await this.loadResults();
        this.saveSearchState();
      }
    },

    async setSortBy(sort) {
      this.sortBy = sort;
      await this.loadResults();
      this.saveSearchState();
    },

    async loadResults(isAdvanced = false) {
      if ((!this.searchQuery && !isAdvanced) || this.isLoading) return;

      this.isLoading = true;

      try {
        let response;

        if (isAdvanced) {
          response = await Search.advancedSearch(
            this.advancedFilters,
            this.currentPage,
            this.pageSize
          );
        } else if (this.searchType === "semantic") {
          response = await Search.semanticSearch(
            this.searchQuery,
            this.currentPage,
            this.pageSize
          );
        } else {
          response = await Search.basicSearch(
            this.searchQuery,
            this.currentPage,
            this.pageSize
          );
        }

        console.log("Search response:", response);

        if (response && response.data) {
          this.results = response?.data?.data?.items || [];
          this.totalResults = response?.data?.data?.total || 0;
          this.totalPages = Math.ceil(this.totalResults / this.pageSize);

          // 处理筛选条件
          this.processFilters(response?.data?.data?.filters || {});
        } else {
          console.error("Unexpected response format:", response);
          this.results = [];
          this.totalResults = 0;
          this.totalPages = 1;
        }
      } catch (error) {
        console.error("Error loading search results:", error);
        this.results = [];
        this.totalResults = 0;
        this.totalPages = 1;
      } finally {
        this.isLoading = false;
      }
    },

    processFilters(filterData) {
      this.filters = {
        types: filterData.types || {},
        journals: filterData.journals || {},
        years: filterData.years || {},
      };
    },

    async applyFilters() {
      this.currentPage = 1;
      await this.loadResults();
      this.saveSearchState();
    },

    async changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return;
      }

      this.currentPage = page;
      await this.loadResults();
      this.saveSearchState();
    },

    viewArticleDetail(id) {
      // 保存当前搜索状态，然后导航到详情页
      this.saveSearchState();
      this.$router.push(`/literature/${id}`);
    },

    parseQueryParams() {
      const query = this.$route.query;

      // 如果已经有保存的搜索状态，不要覆盖它，除非URL参数明确要求新的搜索
      if (this.hasSearchState && !query.q && !query.page && !query.type) {
        return;
      }

      if (query.q) {
        this.searchQuery = query.q;
        this.loadResults();
      }

      if (query.page) {
        const page = parseInt(query.page, 10);
        if (!isNaN(page) && page > 0) {
          this.currentPage = page;
        }
      }

      if (query.type) {
        this.searchType = query.type === "semantic" ? "semantic" : "basic";
      }
    },
  },
  mounted() {
    this.parseQueryParams();

    // 如果没有保存的状态，并且没有查询参数，则重置组件状态
    if (!this.hasSearchState && !this.$route.query.q) {
      this.results = [];
      this.totalResults = 0;
    }
  },
  watch: {
    "$route.query"(newQuery) {
      this.parseQueryParams();
    },
  },
  beforeUnmount() {
    // 在组件卸载前保存状态
    this.saveSearchState();
  },
};
</script>

<style scoped>
.search-page {
  background-color: #f5fbff;
  min-height: 100vh;
}

.search-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 40px 5%;
  text-align: center;
  position: relative;
}

.search-header h1 {
  color: white;
  font-size: 28px;
  margin-bottom: 10px;
}

.search-header p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.search-actions {
  display: flex;
  justify-content: space-between;
  max-width: 700px;
  margin: 15px auto 0;
  color: white;
}

.advanced-search-toggle {
  cursor: pointer;
  text-decoration: underline;
}

.search-type-selector {
  display: flex;
  gap: 15px;
}

.search-type-selector span {
  cursor: pointer;
  padding-bottom: 2px;
}

.search-type-selector span.active {
  border-bottom: 2px solid white;
}

.advanced-search-panel {
  background: white;
  max-width: 700px;
  margin: 20px auto 0;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  text-align: left;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-inputs span {
  color: #666;
}

.date-inputs input {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn-reset {
  background: none;
  border: 1px solid #1a91c1;
  color: #1a91c1;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  flex: 1;
}

.btn-reset:hover {
  background: rgba(26, 145, 193, 0.05);
}

.search-content {
  display: flex;
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 5%;
  gap: 30px;
}

.search-sidebar {
  width: 250px;
  flex-shrink: 0;
}

.filter-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.filter-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group h4 {
  font-size: 16px;
  color: #444;
  margin-bottom: 10px;
}

.filter-item {
  margin-bottom: 8px;
}

.filter-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

.filter-item input {
  margin-right: 8px;
}

.search-results {
  flex: 1;
}

.search-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: #666;
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
  color: #1a91c1;
  font-weight: 500;
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

.result-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.result-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.result-item h3 {
  color: #1a91c1;
  font-size: 18px;
  margin-bottom: 10px;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
}

.article-abstract {
  color: #444;
  margin-bottom: 15px;
  line-height: 1.5;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  background: #e9f7f2;
  color: #66bb6a;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.article-stats {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
  font-size: 14px;
}

.view-btn {
  color: #1a91c1;
  font-weight: 500;
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

@media (max-width: 992px) {
  .search-content {
    flex-direction: column;
  }

  .search-sidebar {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 15px;
  }

  .form-row .form-group {
    margin-bottom: 0;
  }

  .article-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .article-stats {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
