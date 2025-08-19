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
        <label for="max-results">单数据源结果上限:</label>
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
        <div class="status-actions">
          <span :class="['status-badge', `status-${currentTask.status}`]">
            {{ getStatusText(currentTask.status) }}
          </span>
          <!-- 如果有记忆的任务，显示清除按钮 -->
          <button v-if="isRestoredTask" @click="clearMemoryTask" class="clear-memory-btn">
            清除记忆任务
          </button>
        </div>
      </div>

      <div class="task-info">
        <!-- <p><strong>任务ID:</strong> {{ currentTask.id }}</p> -->
        <p><strong>数据源:</strong> {{ currentTask.data_sources?.join(', ') }}</p>
        <p><strong>关键词:</strong> {{ currentTask.keywords?.keywords || '无' }}</p>
        <!-- <p><strong>进度:</strong> {{ currentTask.progress || '0%' }}</p> -->
        <p><strong>预计用时:</strong> 3min</p>

        <!-- <p v-if="currentTask.results_count > 0">
          <strong>已获取文献:</strong> {{ currentTask.results_count }} 篇
        </p> -->
        <p v-if="currentTask.error_message">
          <strong>错误信息:</strong>
          <span class="error-text">{{ currentTask.error_message }}</span>
        </p>
        <!-- 显示任务恢复信息 -->
        <!-- <p v-if="isRestoredTask" class="restore-info">
          <el-icon>
            <InfoFilled />
          </el-icon>
          已从记忆中恢复此任务
        </p> -->
      </div>

      <!-- 轮询进度条 -->
      <div v-if="isPolling" class="polling-progress">
        <div class="progress-bar">
          <div class="progress-value" :class="{ 'polling-animation': !currentTask.progress }"
            :style="{ width: getProgressWidth() }"></div>
        </div>
        <div class="progress-text">
          {{ getProgressText() }}
        </div>
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
          @view-detail="viewArticleDetail(article.id)" />
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
import { Search, Loading, InfoFilled } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import Crawler from "@/api/Crawler"

export default {
  name: "ManualCrawler",
  components: {
    PrimaryButton,
    LiteratureItem,
    Search,
    Loading,
    InfoFilled,
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
      // 记忆功能相关
      isRestoredTask: false, // 标记是否为从记忆中恢复的任务
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
    },
    // 监听当前任务变化，保存到sessionStorage
    currentTask: {
      handler(newTask) {
        if (newTask && newTask.id) {
          this.saveTaskToMemory(newTask.id)
        }
      },
      deep: true
    }
  },
  created() {
    // 组件创建时尝试恢复任务
    this.restoreTaskFromMemory()
  },
  beforeUnmount() {
    // 组件销毁时清除轮询定时器
    this.stopPolling()
  },
  methods: {
    // =============== 记忆功能相关方法 ===============

    // 保存任务ID到sessionStorage
    saveTaskToMemory(taskId) {
      if (taskId) {
        sessionStorage.setItem('manualCrawlerTaskId', taskId)
        sessionStorage.setItem('manualCrawlerCurrentPage', this.currentPage.toString())
      }
    },

    // 从sessionStorage获取保存的任务ID
    getSavedTaskId() {
      return sessionStorage.getItem('manualCrawlerTaskId')
    },

    // 从sessionStorage获取保存的页码
    getSavedCurrentPage() {
      const savedPage = sessionStorage.getItem('manualCrawlerCurrentPage')
      return savedPage ? parseInt(savedPage) : 1
    },

    // 从记忆中恢复任务
    async restoreTaskFromMemory() {
      const savedTaskId = this.getSavedTaskId()
      const savedPage = this.getSavedCurrentPage()

      if (savedTaskId) {
        try {
          console.log('尝试恢复任务:', savedTaskId)
          await this.loadTaskById(savedTaskId)

          if (this.currentTask) {
            this.isRestoredTask = true
            this.currentPage = savedPage
            // this.showMessage('success', `已恢复任务: ${savedTaskId}`)
          }
        } catch (error) {
          console.error('恢复任务失败:', error)
          // 如果恢复失败，清除无效的记忆
          this.clearTaskMemory()
          this.showMessage('warning', '无法恢复之前的任务，可能任务已过期')
        }
      }
    },

    // 根据任务ID加载任务详情
    async loadTaskById(taskId) {
      try {
        const response = await Crawler.getCrawlDetail(taskId)

        if (response.data && response.data.data) {
          this.currentTask = response.data.data

          // 加载文献列表
          if (this.currentTask && Array.isArray(this.currentTask.literature)) {
            this.crawlResults = this.currentTask.literature
          }

          // 如果任务还在运行中，开始轮询
          if (['pending', 'running'].includes(this.currentTask.status)) {
            this.startPolling(taskId)
          }

          return this.currentTask
        } else {
          throw new Error('任务不存在或数据格式错误')
        }
      } catch (error) {
        console.error('加载任务详情失败:', error)
        throw error
      }
    },

    // 清除任务记忆
    clearTaskMemory() {
      sessionStorage.removeItem('manualCrawlerTaskId')
      sessionStorage.removeItem('manualCrawlerCurrentPage')
    },

    // 清除记忆任务（用户主动触发）
    clearMemoryTask() {
      this.clearTaskMemory()
      this.currentTask = null
      this.crawlResults = []
      this.isRestoredTask = false
      this.currentPage = 1
      this.stopPolling()
      this.showMessage('info', '已清除记忆任务')
    },

    // =============== 原有方法 ===============

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
        this.isRestoredTask = false // 重置恢复标记
        console.log("1111:", this.manualCrawler.source_ids)
        const requestData = {
          data_source_ids: this.manualCrawler.source_ids,
          keywords: this.manualCrawler.keywords,
          start_date: this.manualCrawler.startDate,
          end_date: this.manualCrawler.endDate,
          max_results: this.manualCrawler.maxResults,
        }

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
      }, 10000) // 每10秒轮询一次
    },
    getProgressWidth() {
      if (this.currentTask && this.currentTask.progress) {
        // 如果有具体进度，使用具体数值
        const progress = this.currentTask.progress.replace('%', '')
        return `${Math.min(Math.max(parseInt(progress) || 0, 0), 100)}%`
      }
      // 如果没有具体进度，显示动画效果
      return '100%'
    },

    // 获取进度文本
    getProgressText() {
      if (this.currentTask && this.currentTask.progress) {
        return `正在获取爬取结果... ${this.currentTask.progress}`
      }
      return '正在获取爬取结果，请稍候...'
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
          this.currentTask = response.data.data

          if (this.currentTask && Array.isArray(this.currentTask.literature)) {
            this.crawlResults = this.currentTask.literature
          }

          // 根据任务状态决定是否停止轮询
          if (['completed', 'failed'].includes(this.currentTask.status)) {
            this.stopPolling()

            if (this.currentTask.status === 'completed') {
              const count = this.currentTask.results_count || 0
              this.showMessage('success', `爬取任务完成，共获取 ${count} 篇文献`)
            } else if (this.currentTask.status === 'failed') {
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
      // 在跳转前保存当前状态
      if (this.currentTask && this.currentTask.id) {
        this.saveTaskToMemory(this.currentTask.id)
      }

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
      this.isRestoredTask = false
      this.clearTaskMemory() // 清除记忆
    },

    // 切换页面
    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      this.currentPage = page

      // 保存当前页码到记忆中
      if (this.currentTask && this.currentTask.id) {
        this.saveTaskToMemory(this.currentTask.id)
      }

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
      this.isRestoredTask = false
      this.stopPolling()
      this.clearTaskMemory() // 清除记忆
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

.status-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.clear-memory-btn {
  padding: 0.25rem 0.75rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.clear-memory-btn:hover {
  background-color: #5a6268;
}

.task-info p {
  margin: 0.5rem 0;
  color: #6c757d;
  text-align: left;
}

.error-text {
  color: #dc3545;
  font-weight: 500;
}

.restore-info {
  color: #17a2b8;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

  .status-actions {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
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