<!-- src/components/profile/SearchHistoryComponent.vue -->
<template>
  <div class="search-history-component">
    <h3>搜索历史</h3>
    <div v-if="!loading && searchHistory.length" class="search-history">
      <div v-for="(search, index) in searchHistory" :key="index" class="search-history-item">
        <div class="search-query">
          <router-link :to="{ name: 'search', query: { q: search.query } }">
            {{ search.query }}
          </router-link>
        </div>
        <div class="search-meta">
          <span class="search-date">{{ formatDate(search.search_date) }}</span>
          <span class="search-results">{{ search.result_count }} 条结果</span>
        </div>
      </div>
    </div>
    <div v-else-if="loading" class="loading">加载中...</div>
    <div v-else class="empty-state">您还没有搜索记录</div>
  </div>
</template>

<script>
import Search from "@/api/Search"

export default {
  name: "SearchHistoryComponent",
  data() {
    return {
      loading: true,
      searchHistory: [],
    }
  },
  methods: {
    async fetchSearchHistory() {
      this.loading = true
      try {
        const response = await Search.getSearchHistory()
        this.searchHistory = response.data.items || []
      } catch (error) {
        console.error("获取搜索历史失败", error)
        this.$message.error("获取搜索历史失败")
      } finally {
        this.loading = false
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    },
  },
  created() {
    this.fetchSearchHistory()
  },
}
</script>

<style scoped>
.search-history-component {
  width: 100%;
}

.search-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-history-item {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
}

.search-history-item:hover {
  background-color: rgba(168, 230, 207, 0.05);
  border-color: rgba(26, 145, 193, 0.3);
}

.search-query {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.search-meta {
  display: flex;
  justify-content: space-between;
  color: #777;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #777;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
