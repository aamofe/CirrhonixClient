<!-- src/components/crawl/ManualCrawler.vue -->
<template>
  <div class="card manual-crawler">
    <h3>手动爬取</h3>

    <!-- 多数据源选择 -->
    <div class="source-selector">
      <label>选择数据源:</label>
      <div class="checkbox-group">
        <div v-for="source in availableSources" :key="source.id" class="checkbox-item">
          <input type="checkbox" :id="`source-${source.id}`" :value="source.id" v-model="manualCrawler.source_ids"
            class="checkbox-input" />
          <label :for="`source-${source.id}`" class="checkbox-label">
            {{ source.name }}
          </label>
        </div>
      </div>
    </div>

    <div class="query-section">
      <div class="form-group">
        <label for="keywords">关键词:</label>
        <input type="text" id="keywords" v-model="manualCrawler.keywords" class="form-input"
          placeholder="输入检索关键词，多个关键词用英文逗号分隔" />
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label for="start-date">起始日期:</label>
          <input type="date" id="start-date" v-model="manualCrawler.startDate" class="form-input" />
        </div>

        <div class="form-group flex-1">
          <label for="end-date">结束日期:</label>
          <input type="date" id="end-date" v-model="manualCrawler.endDate" class="form-input" />
        </div>
      </div>

      <div class="form-group">
        <label for="max-results">最大结果数:</label>
        <input type="number" id="max-results" v-model="manualCrawler.maxResults" class="form-input" min="1" max="500" />
      </div>
    </div>

    <div class="action-buttons">
      <PrimaryButton :fullWidth="false" @click="startManualCrawling" :disabled="manualCrawling">
        开始爬取
        <template #icon>
          <el-icon v-if="!manualCrawling">
            <Search />
          </el-icon>
          <el-icon v-else class="spinner">
            <Loading />
          </el-icon>
        </template>
      </PrimaryButton>
    </div>

    <!-- 爬取状态显示 -->
    <div v-if="currentTask" class="task-status">
      <div class="status-header">
        <h4>当前任务状态</h4>
        <span :class="['status-badge', `status-${currentTask.status}`]">
          {{ getStatusText(currentTask.status) }}
        </span>
      </div>

      <div class="task-info">
        <p><strong>任务ID:</strong> {{ currentTask.id }}</p>
        <p><strong>数据源:</strong> {{ currentTask.data_sources.join(', ') }}</p>
        <p><strong>关键词:</strong> {{ currentTask.keywords?.keywords || '无' }}</p>
        <p v-if="currentTask.results_count > 0">
          <strong>已获取文献:</strong> {{ currentTask.results_count }} 篇
        </p>
        <p v-if="currentTask.error_message">
          <strong>错误信息:</strong>
          <span class="error-text">{{ currentTask.error_message }}</span>
        </p>
      </div>

      <!-- 轮询进度条 -->
      <div v-if="isPolling" class="polling-progress">
        <div class="progress-bar">
          <div class="progress-value polling-animation"></div>
        </div>
        <div class="progress-text">正在获取爬取结果，请稍候...</div>
      </div>
    </div>

    <!-- 爬取结果显示 -->
    <div v-if="crawlResults.length > 0" class="results-section">
      <div class="results-header">
        <h4>爬取结果 ({{ crawlResults.length }} 篇)</h4>
        <div class="results-actions">
          <button @click="clearResults" class="clear-btn">清空结果</button>
        </div>
      </div>

      <div class="literature-list">
        <literature-item v-for="article in paginatedResults" :key="article.id" :article="article"
          @view-detail="viewArticleDetail(id)" />
      </div>

      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="pagination">
        <span class="page-btn" :class="{ disabled: currentPage === 1 }" @click="changePage(currentPage - 1)">
          上一页
        </span>

        <template v-for="page in displayedPages" :key="page">
          <span v-if="page === '...'" class="page-ellipsis"> ... </span>
          <span v-else class="page-number" :class="{ active: page === currentPage }" @click="changePage(page)">
            {{ page }}
          </span>
        </template>

        <span class="page-btn" :class="{ disabled: currentPage === totalPages }" @click="changePage(currentPage + 1)">
          下一页
        </span>
      </div>
    </div>

    <!-- 无结果提示 -->
    <div v-if="currentTask && currentTask.status === 'completed' && crawlResults.length === 0" class="no-results">
      <p>本次爬取未获得任何文献结果</p>
    </div>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import LiteratureItem from "@/components/layout/LiteratureItem.vue"
import { Search, Loading } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import Crawler from "@/api/Crawler"

export default {
  name: "ManualCrawler",
  components: {
    PrimaryButton,
    LiteratureItem,
    Search,
    Loading,
    ElIcon,
  },
  props: {
    availableSources: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      manualCrawler: {
        source_ids: [], // 改为数组支持多选
        keywords: "",
        startDate: "",
        endDate: "",
        maxResults: 100,
      },
      manualCrawling: false,
      currentTask: null, // 当前任务信息
      crawlResults: [], // 爬取结果
      isPolling: false, // 是否正在轮询
      pollingTimer: null, // 轮询定时器
      messageShown: false,
      lastMessage: "",
      // 分页相关
      currentPage: 1,
      itemsPerPage: 10,
    }
  },
  computed: {
    // 总页数
    totalPages() {
      return Math.ceil(this.crawlResults.length / this.itemsPerPage)
    },
    // 当前页的结果
    paginatedResults() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.crawlResults.slice(start, end)
    },
    // 显示的页码
    displayedPages() {
      const total = this.totalPages
      const current = this.currentPage
      const delta = 2 // 当前页前后显示的页数

      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
      }

      const pages = []

      if (current <= delta + 1) {
        // 当前页在前面
        for (let i = 1; i <= delta + 3; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      } else if (current >= total - delta) {
        // 当前页在后面
        pages.push(1)
        pages.push('...')
        for (let i = total - delta - 2; i <= total; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('...')
        for (let i = current - delta; i <= current + delta; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      }

      return pages
    }
  },
  watch: {
    availableSources: {
      handler(newSources) {
        // 默认选择第一个数据源
        if (newSources.length > 0 && this.manualCrawler.source_ids.length === 0) {
          this.manualCrawler.source_ids = [newSources[0].id]
        }
      },
      immediate: true,
    },
    // 监听爬取结果变化，重置到第一页
    crawlResults() {
      this.currentPage = 1
    }
  },
  beforeUnmount() {
    // 组件销毁时清除轮询定时器
    this.stopPolling()
  },
  methods: {
    // 显示消息并防止重复
    showMessage(type, content) {
      if (this.messageShown && this.lastMessage === content) {
        return
      }

      this.messageShown = true
      this.lastMessage = content
      this.$message[type](content)
      setTimeout(() => {
        this.messageShown = false
      }, 500)
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待执行',
        running: '执行中',
        completed: '已完成',
        failed: '失败'
      }
      return statusMap[status] || status
    },

    // 开始手动爬取
    async startManualCrawling() {
      if (this.manualCrawling) return

      if (!this.manualCrawler.source_ids.length) {
        this.showMessage('error', "请至少选择一个数据源")
        return
      }

      try {
        this.manualCrawling = true
        this.currentTask = null
        this.crawlResults = []

        const requestData = {
          data_source_ids: this.manualCrawler.source_ids,
          keywords: this.manualCrawler.keywords,
          start_date: this.manualCrawler.startDate,
          end_date: this.manualCrawler.endDate,
          max_results: this.manualCrawler.maxResults,
        }

        // 创建任务
        const response = await Crawler.createTask(requestData)

        if (response.data && response.data.task) {
          this.currentTask = response.data.task
          this.showMessage('success', "爬取任务已创建，正在获取结果...")

          // 开始轮询任务状态
          this.startPolling(this.currentTask.id)
        } else {
          throw new Error("创建任务失败")
        }
      } catch (error) {
        console.error("启动爬取任务失败", error)
        this.showMessage('error', "启动爬取任务失败: " + (error.message || "未知错误"))
      } finally {
        this.manualCrawling = false
      }
    },

    // 开始轮询任务状态
    startPolling(taskId) {
      this.isPolling = true
      this.pollingTimer = setInterval(async () => {
        try {
          await this.checkTaskStatus(taskId)
        } catch (error) {
          console.error("轮询任务状态失败", error)
          this.stopPolling()
          this.showMessage('error', "获取任务状态失败")
        }
      }, 3000) // 每2秒轮询一次
    },

    // 停止轮询
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
      this.isPolling = false
    },

    // 检查任务状态
    async checkTaskStatus(taskId) {
      try {
        const response = await Crawler.getCrawlDetail(taskId)

        if (response.data) {
          this.currentTask = response.data

          // 如果有文献结果，更新结果列表
          if (response.data.literature && Array.isArray(response.data.literature)) {
            this.crawlResults = response.data.literature
          }

          // 根据任务状态决定是否停止轮询
          if (['completed', 'failed'].includes(response.data.status)) {
            this.stopPolling()

            if (response.data.status === 'completed') {
              const count = response.data.results_count || 0
              this.showMessage('success', `爬取任务完成，共获取 ${count} 篇文献`)
            } else if (response.data.status === 'failed') {
              this.showMessage('error', "爬取任务失败: " + (response.data.error_message || "未知错误"))
            }
          }
        }
      } catch (error) {
        console.error("获取任务详情失败", error)
        throw error
      }
    },

    // 处理文献详情查看
    viewArticleDetail(id) {
      this.$router.push({
        name: "literature-detail",
        params: { id },
      })
    },

    // 清空结果
    clearResults() {
      this.crawlResults = []
      this.currentTask = null
      this.currentPage = 1
    },

    // 切换页面
    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      this.currentPage = page

      // 滚动到结果区域顶部
      this.$nextTick(() => {
        const resultsSection = this.$el.querySelector('.results-section')
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },

    // 重置表单
    resetForm() {
      this.manualCrawler = {
        source_ids: this.availableSources.length > 0 ? [this.availableSources[0].id] : [],
        keywords: "",
        startDate: "",
        endDate: "",
        maxResults: 100,
      }
      this.currentTask = null
      this.crawlResults = []
      this.currentPage = 1
      this.stopPolling()
    },
  },
}
</script>

<style scoped>
.manual-crawler {
  margin-bottom: 2rem;
}

.source-selector {
  margin-bottom: 1.5rem;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-input {
  margin: 0;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  color: #444;
  font-weight: normal;
}

.query-section {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
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

.form-input,
.select-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus,
.select-input:focus {
  outline: none;
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.2);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
}

/* 任务状态样式 */
.task-status {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-header h4 {
  margin: 0;
  color: #495057;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-running {
  background-color: #cce5ff;
  color: #004085;
}

.status-completed {
  background-color: #d1edff;
  color: #0c5460;
}

.status-failed {
  background-color: #f8d7da;
  color: #721c24;
}

.task-info p {
  margin: 0.5rem 0;
  color: #6c757d;
}

.error-text {
  color: #dc3545;
  font-weight: 500;
}

/* 轮询进度条 */
.polling-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-value {
  height: 100%;
  background: linear-gradient(to right, #a8e6cf, #1a91c1);
  border-radius: 4px;
  transition: width 0.3s;
}

.polling-animation {
  width: 100%;
  background: linear-gradient(90deg,
      transparent,
      rgba(168, 230, 207, 0.5),
      transparent);
  animation: polling 2s ease-in-out infinite;
}

@keyframes polling {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: 14px;
  color: #6c757d;
  text-align: center;
}

/* 结果区域样式 */
.results-section {
  margin: 2rem 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.results-header h4 {
  margin: 0;
  color: #495057;
}

.results-actions {
  display: flex;
  gap: 0.5rem;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.clear-btn:hover {
  background-color: #5a6268;
}

.literature-list {
  margin-bottom: 2rem;
}

/* 分页样式 */
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

/* 无结果提示 */
.no-results {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 2rem 0;
}

.no-results p {
  margin: 0;
  font-size: 16px;
}

/* 加载动画 */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .checkbox-group {
    flex-direction: column;
    gap: 0.5rem;
  }

  .status-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .page-btn,
  .page-number {
    padding: 0.4rem 0.6rem;
    font-size: 12px;
    min-width: 36px;
  }
}
</style>