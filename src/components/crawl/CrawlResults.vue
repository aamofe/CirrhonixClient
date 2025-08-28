<!-- src/components/crawl/CrawlResults.vue -->
<template>
  <div class="crawl-results">
    <!-- 任务状态显示 -->
    <div v-if="task" class="task-status">
      <div class="status-header">
        <h4>当前任务状态</h4>
        <div class="status-actions">
          <span :class="['status-badge', `status-${task.status}`]">
            {{ getStatusText(task.status) }}
          </span>
          <button v-if="isRestoredTask" @click="$emit('clear-memory')" class="clear-memory-btn">
            清除记忆任务
          </button>
        </div>
      </div>

      <div class="task-info">
        <p><strong>数据源:</strong> {{ task.data_sources?.join(', ') || '无' }}</p>
        <p><strong>关键词:</strong> {{ task.keywords?.keywords || '无' }}</p>
        <p v-if="task.start_time"><strong>开始时间:</strong> {{ formatTime(task.start_time) }}</p>
        <p v-if="task.end_time"><strong>结束时间:</strong> {{ formatTime(task.end_time) }}</p>
        <p v-if="task.results_count !== undefined">
          <strong>获取文献数:</strong> {{ task.results_count }} 篇
        </p>
        <p v-if="task.status === 'failed'">
          <strong>失败原因:</strong>
          <span class="error-text">{{ task.error_message }}</span>
        </p>
        <p v-else-if="task.error_message">
          <strong>处理详情:</strong>
          <span class="error-text">{{ task.error_message }}</span>
        </p>
      </div>

      <!-- 轮询进度条 -->
      <div v-if="isPolling" class="polling-progress">
        <div class="progress-bar">
          <div class="progress-value" :class="{ 'polling-animation': !task.progress }"
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
          <button @click="$emit('clear-results')" class="clear-btn">清空结果</button>
        </div>
      </div>

      <div class="literature-list">
        <literature-item v-for="article in paginatedResults" :key="article.id" :article="article"
          @view-detail="$emit('view-detail', article.id)" />
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
    <div v-if="task && task.status === 'completed' && crawlResults.length === 0" class="no-results">
      <p>本次爬取未获得任何文献结果</p>
    </div>
  </div>
</template>

<script>
import LiteratureItem from "@/components/layout/LiteratureItem.vue"

export default {
  name: "CrawlResults",
  components: {
    LiteratureItem,
  },
  props: {
    // 爬虫结果数组
    crawlResults: {
      type: Array,
      default: () => [],
    },
    // 任务详细信息
    task: {
      type: Object,
      default: null,
    },
    // 是否正在轮询
    isPolling: {
      type: Boolean,
      default: false,
    },
    // 是否为恢复的任务
    isRestoredTask: {
      type: Boolean,
      default: false,
    },
    // 每页显示数量
    itemsPerPage: {
      type: Number,
      default: 10,
    },
  },
  emits: [
    'clear-memory',    // 清除记忆任务
    'clear-results',   // 清空结果
    'view-detail',     // 查看详情
    'page-change',     // 页面变化
  ],
  data() {
    return {
      currentPage: 1,
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.crawlResults.length / this.itemsPerPage)
    },

    paginatedResults() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.crawlResults.slice(start, end)
    },

    displayedPages() {
      const total = this.totalPages
      const current = this.currentPage
      const delta = 2

      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
      }

      const pages = []

      if (current <= delta + 1) {
        for (let i = 1; i <= delta + 3; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      } else if (current >= total - delta) {
        pages.push(1)
        pages.push('...')
        for (let i = total - delta - 2; i <= total; i++) {
          pages.push(i)
        }
      } else {
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
    // 当结果变化时重置到第一页
    crawlResults() {
      this.currentPage = 1
    },
  },
  methods: {
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待执行',
        queued: '已排队',
        running: '执行中',
        completed: '已完成',
        failed: '失败'
      }
      return statusMap[status] || status
    },

    // 获取进度条宽度
    getProgressWidth() {
      if (this.task && this.task.progress) {
        const progress = this.task.progress.replace('%', '')
        return `${Math.min(Math.max(parseInt(progress) || 0, 0), 100)}%`
      }
      return '100%'
    },

    // 获取进度文本
    getProgressText() {
      if (this.task && this.task.progress) {
        return `正在获取爬取结果... ${this.task.progress}`
      }
      return '正在获取爬取结果，请稍候...'
    },

    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return ''
      try {
        const date = new Date(timeStr)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch {
        return timeStr
      }
    },

    // 切换页面
    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      this.currentPage = page

      // 通知父组件页面变化
      this.$emit('page-change', page)

      // 滚动到结果区域顶部
      this.$nextTick(() => {
        const resultsSection = this.$el.querySelector('.results-section')
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },
  },
}
</script>

<style scoped>
.crawl-results {
  margin: 2rem 0;
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

.status-queued {
  background-color: #e9ecef;
  color: #495057;
}

.status-running {
  background-color: #cce5ff;
  color: #004085;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
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

/* 响应式设计 */
@media (max-width: 768px) {
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