<!-- src/components/crawl/CrawlerHistory.vue -->
<template>
  <div class="card crawler-history">
    <h3>爬取历史记录</h3>

    <div class="history-filters">
      <div class="form-group">
        <label for="history-source">数据源:</label>
        <select
          id="history-source"
          v-model="historyFilter.source_id"
          class="select-input"
        >
          <option value="">全部</option>
          <option
            v-for="source in availableSources"
            :key="source.id"
            :value="source.id"
          >
            {{ source.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="history-status">任务状态:</label>
        <select
          id="history-status"
          v-model="historyFilter.status"
          class="select-input"
        >
          <option value="">全部</option>
          <option value="pending">等待中</option>
          <option value="running">运行中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
      </div>
    </div>

    <div class="history-table">
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>数据源</th>
            <th>关键词</th>
            <th>爬取数量</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(history, index) in filteredHistory" :key="index">
            <td>{{ formatDate(history.start_time) }}</td>
            <td>{{ history.data_source.name }}</td>
            <td>
              {{
                (history.query_params && history.query_params.keywords) ||
                history.query_params.fields_of_study ||
                "无"
              }}
            </td>
            <td>
              {{ history.results_count === 0 ? 100 : history.results_count }}
            </td>
            <td :class="history.status">
              {{ formatStatus(history.status) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!filteredHistory.length" class="empty-history">
        没有符合条件的爬取记录
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="filteredHistory.length" class="pagination">
      <button
        class="pagination-btn prev"
        @click="currentPage > 1 && changePage(currentPage - 1)"
        :disabled="currentPage === 1"
      >
        上一页
      </button>
      <span class="page-info">第 {{ currentPage }} 页</span>
      <button
        class="pagination-btn next"
        @click="hasNextPage && changePage(currentPage + 1)"
        :disabled="!hasNextPage"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import Crawler from "@/api/Crawler";

export default {
  name: "CrawlerHistory",
  props: {
    availableSources: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      crawlerHistory: [],
      historyFilter: {
        source_id: "",
        status: "",
      },
      currentPage: 1,
      pageSize: 10,
    };
  },
  computed: {
    // 过滤后的历史记录
    filteredHistory() {
      let filtered = this.crawlerHistory;

      if (this.historyFilter.source_id) {
        filtered = filtered.filter(
          (item) => item.data_source.id === this.historyFilter.source_id
        );
      }

      if (this.historyFilter.status) {
        filtered = filtered.filter(
          (item) => item.status === this.historyFilter.status
        );
      }

      // 分页
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;

      return filtered.slice(start, end);
    },

    hasNextPage() {
      // 考虑筛选条件下的总记录数
      const filteredTotal = this.crawlerHistory.filter((item) => {
        let match = true;

        if (this.historyFilter.source_id) {
          match = match && item.data_source.id === this.historyFilter.source_id;
        }

        if (this.historyFilter.status) {
          match = match && item.status === this.historyFilter.status;
        }

        return match;
      }).length;

      return this.currentPage * this.pageSize < filteredTotal;
    },
  },
  methods: {
    // 获取爬取历史
    async fetchCrawlerHistory() {
      try {
        const response = await Crawler.getCrawlList(
          this.historyFilter.status,
          this.historyFilter.source_id,
          this.currentPage,
          this.pageSize
        );

        if (response.data && response.data.data) {
          this.crawlerHistory = response.data.data;
        } else {
          this.crawlerHistory = [];
        }
      } catch (error) {
        console.error("获取爬取历史失败", error);
        this.$message.error("获取爬取历史失败");
      }
    },

    // 切换页码
    changePage(page) {
      this.currentPage = page;
      this.$emit("page-changed", page);
    },

    // 格式化状态
    formatStatus(status) {
      switch (status) {
        case "completed":
          return "已完成";
        case "running":
          return "运行中";
        case "failed":
          return "失败";
        case "pending":
          return "等待中";
        default:
          return status;
      }
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return "";

      const date = new Date(dateString);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  created() {
    // 获取爬取历史
    this.fetchCrawlerHistory();
  },
  // 监听筛选条件变化
  watch: {
    "historyFilter.source_id"() {
      this.currentPage = 1;
      this.fetchCrawlerHistory();
    },
    "historyFilter.status"() {
      this.currentPage = 1;
      this.fetchCrawlerHistory();
    },
  },
};
</script>

<style scoped>
.card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.card h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 600;
}

.history-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.select-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.select-input:focus {
  outline: none;
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.2);
}

.history-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 600;
  color: #444;
  background-color: #f9f9f9;
}

td.pending {
  color: #ffc107;
}

td.running {
  color: #17a2b8;
}

td.completed {
  color: #28a745;
}

td.failed {
  color: #dc3545;
}

.empty-history {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #a8e6cf;
  background-color: rgba(168, 230, 207, 0.1);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-filters {
    flex-direction: column;
    gap: 0;
  }
}
</style>
