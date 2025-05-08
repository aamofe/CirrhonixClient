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
    </section>

    <div class="literature-content">
      <div class="filter-sidebar">
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

      <div class="literature-results">
        <div class="loading" v-if="isLoading">
          <div class="spinner"></div>
          <p>正在加载文献...</p>
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
import SiteFooter from "@/components/layout/SiteFooter.vue";
import Literature from "@/api/Literature";
import LiteratureItem from "@/components/LiteratureItem.vue";

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
      // 添加一个标志来追踪是否有保存的列表状态
      hasListState: false,
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
    this.restoreListState();

    // 如果没有已保存的状态，则加载所有文献
    if (!this.hasListState) {
      this.loadAllLiterature();
    }
  },
  methods: {
    // 保存列表状态到 sessionStorage
    saveListState() {
      const listState = {
        searchQuery: this.searchQuery,
        results: this.results,
        totalResults: this.totalResults,
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        sortBy: this.sortBy,
        filters: this.filters,
        selectedFilters: this.selectedFilters,
      };

      sessionStorage.setItem("literatureListState", JSON.stringify(listState));
      this.hasListState = true;
    },

    // 从 sessionStorage 恢复列表状态
    restoreListState() {
      const savedState = sessionStorage.getItem("literatureListState");

      if (savedState) {
        try {
          const state = JSON.parse(savedState);

          // 恢复列表状态
          this.searchQuery = state.searchQuery || "";
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

          this.hasListState = true;
        } catch (error) {
          console.error("Error restoring literature list state:", error);
          this.hasListState = false;
        }
      } else {
        this.hasListState = false;
      }
    },

    async loadAllLiterature() {
      this.isLoading = true;

      try {
        const response = await Literature.list({
          page: this.currentPage,
          pageSize: this.pageSize,
          sortBy: this.sortBy,
          ...this.getFilterParams(),
        });

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
        console.error("Error loading literature list:", error);
        this.results = [];
        this.totalResults = 0;
        this.totalPages = 1;
      } finally {
        this.isLoading = false;
      }
    },

    async onSearch(query) {
      this.searchQuery = query;
      this.currentPage = 1;

      if (!query) {
        await this.loadAllLiterature();
      } else {
        await this.searchLiterature();
      }

      this.saveListState();
    },

    async searchLiterature() {
      this.isLoading = true;

      try {
        const response = await Literature.search({
          query: this.searchQuery,
          page: this.currentPage,
          pageSize: this.pageSize,
          sortBy: this.sortBy,
          ...this.getFilterParams(),
        });

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
        console.error("Error searching literature:", error);
        this.results = [];
        this.totalResults = 0;
        this.totalPages = 1;
      } finally {
        this.isLoading = false;
      }
    },

    getFilterParams() {
      const filterParams = {};

      if (this.selectedFilters.types.length > 0) {
        filterParams.types = this.selectedFilters.types;
      }

      if (this.selectedFilters.journals.length > 0) {
        filterParams.journals = this.selectedFilters.journals;
      }

      if (this.selectedFilters.years.length > 0) {
        filterParams.years = this.selectedFilters.years;
      }

      return filterParams;
    },

    processFilters(filterData) {
      this.filters = {
        types: filterData.types || {},
        journals: filterData.journals || {},
        years: filterData.years || {},
      };
    },

    async setSortBy(sort) {
      this.sortBy = sort;

      if (this.searchQuery) {
        await this.searchLiterature();
      } else {
        await this.loadAllLiterature();
      }

      this.saveListState();
    },

    async applyFilters() {
      this.currentPage = 1;

      if (this.searchQuery) {
        await this.searchLiterature();
      } else {
        await this.loadAllLiterature();
      }

      this.saveListState();
    },

    async changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return;
      }

      this.currentPage = page;

      if (this.searchQuery) {
        await this.searchLiterature();
      } else {
        await this.loadAllLiterature();
      }

      this.saveListState();
    },

    viewArticleDetail(id) {
      // 保存当前列表状态，然后导航到详情页
      this.saveListState();
      this.$router.push({
        name: "literature-detail",
        params: { id },
      });
    },

    parseQueryParams() {
      const query = this.$route.query;

      // 如果已经有保存的列表状态，不要覆盖它，除非URL参数明确要求新的搜索
      if (this.hasListState && !query.q && !query.page) {
        return;
      }

      if (query.q) {
        this.searchQuery = query.q;
        this.searchLiterature();
      } else {
        this.loadAllLiterature();
      }

      if (query.page) {
        const page = parseInt(query.page, 10);
        if (!isNaN(page) && page > 0) {
          this.currentPage = page;
        }
      }
    },
  },
  mounted() {
    this.parseQueryParams();
  },
  watch: {
    "$route.query"(newQuery) {
      this.parseQueryParams();
    },
  },
  beforeUnmount() {
    // 在组件卸载前保存状态
    this.saveListState();
  },
};
</script>
