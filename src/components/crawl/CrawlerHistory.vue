<!-- src/components/crawl/CrawlerHistory.vue -->
<template>
  <div class="card crawler-history">
    <h3>爬取历史记录</h3>

    <div class="history-filters">
      <div class="form-group">
        <label for="history-source">数据源:</label>
        <select id="history-source" v-model="historyFilter.source_id" class="select-input">
          <option value="">全部</option>
          <option v-for="source in availableSources" :key="source.id" :value="source.id">
            {{ source.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="history-status">任务状态:</label>
        <select id="history-status" v-model="historyFilter.status" class="select-input">
          <option value="">全部</option>
          <option value="pending">等待中</option>
          <option value="queued">已排队</option>
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
            <th>进度</th>
            <th>状态</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(history, index) in filteredHistory" :key="index">
            <td class="start-time-cell">
              <span class="date">{{ history.start_time?.split(' ')[0] }}</span><br>
              <span class="time">{{ history.start_time?.split(' ')[1] }}</span>
            </td>
            <td>
              <div class="data-sources">
                <span v-for="(source, idx) in history.data_sources" :key="idx" class="source-tag">
                  {{ source }}
                </span>
              </div>
            </td>
            <td>
              {{
                (history.keywords && history.keywords.keywords) ||
                "无"
              }}
            </td>
            <td>
              {{ history.results_count }}
            </td>
            <td>
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: history.progress || '0%' }"></div>
                </div>
                <span class="progress-text">{{ history.progress || '0%' }}</span>
              </div>
            </td>
            <td :class="history.status">
              {{ formatStatus(history.status) }}
            </td>
            <td>
              {{ history.error_message || '-' }}
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
      <button class="pagination-btn prev" @click="currentPage > 1 && changePage(currentPage - 1)"
        :disabled="currentPage === 1">
        上一页
      </button>
      <span class="page-info">第 {{ currentPage }} 页</span>
      <button class="pagination-btn next" @click="hasNextPage && changePage(currentPage + 1)" :disabled="!hasNextPage">
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import Crawler from "@/api/Crawler"

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
    }
  },
  computed: {

    filteredHistory() {
      let filtered = this.crawlerHistory

      if (this.historyFilter.source_id) {

        filtered = filtered.filter(
          (item) => item.data_sources && item.data_sources.includes(this.historyFilter.source_id)
        )
      }

      if (this.historyFilter.status) {
        filtered = filtered.filter(
          (item) => item.status === this.historyFilter.status
        )
      }


      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize

      return filtered.slice(start, end)
    },

    hasNextPage() {

      const filteredTotal = this.crawlerHistory.filter((item) => {
        let match = true

        if (this.historyFilter.source_id) {
          match = match && item.data_sources && item.data_sources.includes(this.historyFilter.source_id)
        }

        if (this.historyFilter.status) {
          match = match && item.status === this.historyFilter.status
        }

        return match
      }).length

      return this.currentPage * this.pageSize < filteredTotal
    },
  },
  methods: {

    async fetchCrawlerHistory() {
      try {
        const response = await Crawler.getCrawlList(
          this.historyFilter.status,
          this.historyFilter.source_id,
          this.currentPage,
          this.pageSize
        )

        if (response.data && response.data.data) {
          this.crawlerHistory = response.data.data
        } else {
          this.crawlerHistory = []
        }
      } catch (error) {

        this.$message.error("获取爬取历史失败")
      }
    },


    changePage(page) {
      this.currentPage = page
      this.$emit("page-changed", page)
    },


    formatStatus(status) {
      switch (status) {
        case "completed":
          return "已完成"
        case "running":
          return "运行中"
        case "failed":
          return "失败"
        case "queued":
          return "已排队"
        case "pending":
          return "等待中"
        default:
          return status
      }
    },

  },
  created() {

    this.fetchCrawlerHistory()
  },

  watch: {
    "historyFilter.source_id"() {
      this.currentPage = 1
      this.fetchCrawlerHistory()
    },
    "historyFilter.status"() {
      this.currentPage = 1
      this.fetchCrawlerHistory()
    },
  },
}
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

.start-time-cell {
  line-height: 1.4;
  text-align: center;
}

.start-time-cell .date {
  font-weight: 500;
  color: #333;
}

.start-time-cell .time {
  font-size: 12px;
  color: #666;
}

table {
  width: 100%;
  border-collapse: collapse;
}

.start-time-cell {
  line-height: 1.4;
  text-align: center;
  white-space: nowrap;
}

.start-time-cell .date {
  font-weight: 500;
  color: #333;
}

.start-time-cell .time {
  font-size: 12px;
  color: #666;
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

/* 数据源标签样式 */
.data-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.source-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 进度条样式 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  min-width: 60px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #666;
  min-width: 35px;
}

/* 状态样式 */
td.pending {
  color: #ffc107;
  font-weight: 500;
}

td.queued {
  color: #6c757d;
  font-weight: 500;
}

td.running {
  color: #17a2b8;
  font-weight: 500;
}

td.completed {
  color: #28a745;
  font-weight: 500;
}

td.failed {
  color: #dc3545;
  font-weight: 500;
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

  .data-sources {
    flex-direction: column;
  }

  .progress-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .progress-bar {
    width: 100%;
  }
}
</style>