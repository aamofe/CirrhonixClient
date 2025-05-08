<!-- src/views/AuthorsPage.vue -->
<template>
  <div class="authors-page">
    <section class="page-header">
      <h1>肝硬化研究专家</h1>
      <p>汇集全球肝硬化研究领域的权威专家与学者资料，便于学术交流与合作</p>

      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索专家姓名或所属机构..."
          @input="debounceSearch"
        />
        <button class="search-button" @click="search">搜索</button>
      </div>
    </section>

    <div class="main-content">
      <div class="filter-section">
        <div class="filter-group">
          <h3>排序方式</h3>
          <div class="sort-options">
            <span
              :class="{ active: sortBy === 'name' }"
              @click="setSortBy('name')"
              >按姓名</span
            >
            <span
              :class="{ active: sortBy === 'publications' }"
              @click="setSortBy('publications')"
              >按发表数量</span
            >
          </div>
        </div>
      </div>

      <div class="loading" v-if="isLoading">
        <div class="spinner"></div>
        <p>正在加载专家数据...</p>
      </div>

      <div v-else-if="authors.length === 0" class="no-results">
        <p>未找到符合条件的专家。</p>
        <p>请尝试使用其他关键词进行搜索。</p>
      </div>

      <div v-else class="authors-grid">
        <div class="author-card" v-for="author in authors" :key="author.id">
          <div class="author-avatar">
            <div class="avatar-placeholder">
              {{ getInitials(author.name) }}
            </div>
          </div>
          <div class="author-info">
            <h3>{{ author.name }}</h3>
            <p class="affiliation">{{ author.affiliation || "无机构信息" }}</p>
            <div class="publication-count">
              发表文献: <span>{{ author.publication_count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="totalPages > 0">
        <span
          class="page-btn"
          :class="{ disabled: currentPage === 1 }"
          @click="changePage(currentPage - 1)"
        >
          上一页
        </span>

        <template v-for="page in displayedPages" :key="page">
          <span v-if="page === '...'" class="page-ellipsis">...</span>
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
    </div>

    <site-footer />
  </div>
</template>

<script>
import SiteFooter from "@/components/layout/SiteFooter.vue";
import Literature from "@/api/Literature";
import _ from "lodash";

export default {
  name: "AuthorsPage",
  components: {
    SiteFooter,
  },
  data() {
    return {
      authors: [],
      isLoading: false,
      searchQuery: "",
      sortBy: "publications",
      currentPage: 1,
      pageSize: 12,
      totalItems: 0,
      totalPages: 0,
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
    this.debounceSearch = _.debounce(this.search, 300);
    this.loadAuthors();
  },
  methods: {
    async loadAuthors() {
      this.isLoading = true;
      try {
        const response = await Literature.getAuthors({
          name: this.searchQuery,
          affiliation: this.searchQuery,
          sort: this.sortBy,
          page: this.currentPage,
          size: this.pageSize,
        });

        if (response && response.data && response.data.data) {
          this.authors = response.data.data.items || [];
          this.totalItems = response.data.data.pagination.total || 0;
          this.totalPages = response.data.data.pagination.pages || 0;
        } else {
          console.error("Unexpected response format:", response);
          this.authors = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      } catch (error) {
        console.error("Error loading authors:", error);
        this.authors = [];
        this.totalItems = 0;
        this.totalPages = 0;
      } finally {
        this.isLoading = false;
      }
    },
    search() {
      this.currentPage = 1;
      this.loadAuthors();
    },
    setSortBy(sort) {
      this.sortBy = sort;
      this.currentPage = 1;
      this.loadAuthors();
    },
    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return;
      }
      this.currentPage = page;
      this.loadAuthors();
    },
    getInitials(name) {
      if (!name) return "?";
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    },
  },
};
</script>

<style scoped>
.authors-page {
  background-color: #f5fbff;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 60px 5%;
  text-align: center;
  position: relative;
}

.page-header h1 {
  color: white;
  font-size: 32px;
  margin-bottom: 15px;
}

.page-header p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 30px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.search-container {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
}

.search-container input {
  flex: 1;
  padding: 12px 15px;
  border: none;
  border-radius: 8px 0 0 8px;
  font-size: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.search-button {
  background: #1a91c1;
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 0 8px 8px 0;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.search-button:hover {
  background: #157da6;
}

.main-content {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 5%;
}

.filter-section {
  margin-bottom: 30px;
}

.filter-group h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.sort-options {
  display: flex;
  gap: 20px;
}

.sort-options span {
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 20px;
  transition: all 0.3s;
}

.sort-options span.active {
  background: #1a91c1;
  color: white;
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

.authors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.author-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  gap: 15px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.author-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.author-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  background-color: #1a91c1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
}

.author-info {
  flex: 1;
}

.author-info h3 {
  color: #333;
  font-size: 18px;
  margin-bottom: 5px;
}

.affiliation {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.publication-count {
  color: #1a91c1;
  font-size: 14px;
}

.publication-count span {
  font-weight: bold;
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
  .authors-grid {
    grid-template-columns: 1fr;
  }

  .sort-options {
    justify-content: center;
  }
}
</style>
