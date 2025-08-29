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
            <th>任务类型</th>
            <th>状态</th>
            <th>操作</th>
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
                <span class="source-tag">
                  {{ getDisplaySources(history.data_sources) }}
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
              <span class="task-type" :class="{ 'scheduled': history.scheduled, 'manual': !history.scheduled }">
                {{ history.scheduled ? '定时任务' : '手动任务' }}
              </span>
            </td>
            <td :class="history.status">
              {{ formatStatus(history.status) }}
            </td>
            <td>
              <button
                v-if="(history.status === 'completed' || history.status === 'failed') && history.results_count >= 0"
                @click="viewResults(history)" class="view-results-btn" :disabled="loadingTaskId === history.id">
                {{ loadingTaskId === history.id ? '加载中...' : '查看结果' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!filteredHistory.length" class="empty-history">
        没有符合条件的爬取记录
      </div>
    </div>

    <Pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages" @page-change="changePage" />

    <div v-if="showResultCard" class="result-card-overlay" @click="closeResultCard">
      <div class="result-card" @click.stop>
        <div class="result-card-header">
          <h4>爬取结果详情</h4>
          <button @click="closeResultCard" class="close-btn">×</button>
        </div>
        <div class="result-card-content">
          <CrawlResults :crawlResults="currentResults" :task="currentTask" :isPolling="false" :isRestoredTask="false"
            :itemsPerPage="5" @clear-memory="handleClearMemory" @clear-results="handleClearResults"
            @view-detail="handleViewDetail" @page-change="handlePageChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Crawler from "@/api/Crawler"
import CrawlResults from "./CrawlResults.vue"
import Pagination from "@/components/navigation/Pagination.vue"
export default {
  name: "CrawlerHistory",
  components: {
    CrawlResults,
    Pagination,
  },
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
      totalHistoryCount: 0,
      showResultCard: false,
      currentResults: [],
      currentTask: null,
      loadingTaskId: null,
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
    filteredTotal() {
      return this.crawlerHistory.filter((item) => {
        let match = true

        if (this.historyFilter.source_id) {
          match = match && item.data_sources && item.data_sources.includes(this.historyFilter.source_id)
        }

        if (this.historyFilter.status) {
          match = match && item.status === this.historyFilter.status
        }

        return match
      }).length
    },

    totalPages() {
      return Math.ceil(this.filteredTotal / this.pageSize)
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
          this.totalHistoryCount = response.data.data?.length
        } else {
          this.crawlerHistory = []
        }
      } catch (error) {
        this.$message.error("获取爬取历史失败")
      }
    },

    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      this.currentPage = page
      this.fetchCrawlerHistory() // Call API to get data for the new page
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
    getDisplaySources(dataSources) {
      if (!dataSources || !Array.isArray(dataSources)) {
        return ""
      }
      if (dataSources.length === 0) {
        return ""
      }
      let displayString = dataSources[0]
      if (dataSources.length > 1) {
        displayString += "..."
      }
      return displayString
    },
    async viewResults(history) {
      try {
        this.loadingTaskId = history.id
        const response = await Crawler.getCrawlDetail(history.id)

        if (response.data && response.data.data) {
          this.currentResults = response.data.data.literature || []
          this.currentTask = {
            id: history.id,
            status: history.status,
            data_sources: history.data_sources,
            keywords: history.keywords,
            start_time: history.start_time,
            end_time: history.end_time,
            results_count: history.results_count,
            error_message: history.error_message,
          }
          this.showResultCard = true
        } else {
          this.$message.warning("该任务暂无结果数据")
        }
      } catch (error) {
        console.error("获取爬取结果详情失败:", error)
        this.$message.error("获取爬取结果详情失败")
      } finally {
        this.loadingTaskId = null
      }
    },

    closeResultCard() {
      this.showResultCard = false
      this.currentResults = []
      this.currentTask = null
    },

    handleClearMemory() {
      console.log("清除记忆任务")
    },

    handleClearResults() {
      this.currentResults = []
    },

    handleViewDetail(articleId) {
      this.$emit("view-article-detail", articleId)
    },

    handlePageChange(page) {
      console.log("结果页面变化:", page)
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

/* 任务类型样式 */
.task-type {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  display: inline-block;
}

.task-type.scheduled {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.task-type.manual {
  background-color: #fff3e0;
  color: #f57c00;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 2rem 0;
}

.page-btn,
.page-number {
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 14px;
  min-width: 40px;
  text-align: center;
}

.page-btn:hover:not(.disabled),
.page-number:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.page-number.active {
  background-color: #a8e6cf;
  border-color: #a8e6cf;
  color: white;
}

.page-btn.disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #dee2e6;
}

.page-ellipsis {
  padding: 0.5rem 0.25rem;
  color: #6c757d;
  font-size: 14px;
}

/* 查看结果按钮 */
.view-results-btn {
  padding: 0.5rem 1rem;
  background-color: #a8e6cf;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.view-results-btn:hover:not(:disabled) {
  background-color: #90d4a8;
}

.view-results-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 结果卡片样式 */
.result-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  z-index: 1000;
  overflow-y: auto;
}

.result-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
}

.result-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.result-card-header h4 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: #e9ecef;
  color: #333;
}

.result-card-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.empty-history {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
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

  .result-card-overlay {
    padding: 1rem;
  }

  .result-card {
    width: 95%;
    margin-top: 1rem;
  }

  .result-card-header {
    padding: 1rem;
  }

  .result-card-content {
    padding: 1rem;
  }
}
</style>