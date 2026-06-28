<!-- src/components/crawl/CrawlResults.vue -->
<template>
  <div class="crawl-results">
    <div v-if="task" class="task-status">
      <div class="status-header">
        <h4>当前任务状态</h4>
        <div class="status-actions">
          <StatusBadge :status="task.status" />
          <CancelButton v-if="isRestoredTask" @click="$emit('clear-memory')">
            清除记忆任务
          </CancelButton>
        </div>
      </div>

      <div class="task-info">
        <p><strong>数据源:</strong> {{ task.data_sources?.join(', ') || '无' }}</p>
        <p><strong>关键词:</strong> {{ task.keywords?.keywords || '无' }}</p>
        <p v-if="task.start_time"><strong>开始时间:</strong> {{ formatDateTime(task.start_time) }}</p>
        <p v-if="task.end_time"><strong>结束时间:</strong> {{ formatDateTime(task.end_time) }}</p>
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

    <div v-if="crawlResults.length > 0" class="results-section">
      <div class="results-header">
        <h4>爬取结果 ({{ crawlResults.length }} 篇)</h4>
        <div class="results-actions">
          <CancelButton @click="$emit('clear-results')">清空结果</CancelButton>
        </div>
      </div>

      <div class="literature-list">
        <LiteratureCard
          v-for="article in paginatedResults"
          :key="article.id"
          :article="article"
          @view-detail="$emit('view-detail', article.id)"
        />
      </div>

      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="changePage"
      />
    </div>

    <EmptyState
      v-if="task && task.status === 'completed' && crawlResults.length === 0"
      message="本次爬取未获得任何文献结果"
    />
  </div>
</template>

<script>
import LiteratureCard from '@/components/literature/LiteratureCard.vue'
import Pagination from '@/components/navigation/Pagination.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CancelButton from '@/components/ui/CancelButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { formatDateTime } from '@/utils/format'

export default {
  name: 'CrawlResults',
  components: {
    LiteratureCard,
    Pagination,
    StatusBadge,
    CancelButton,
    EmptyState,
  },
  props: {
    crawlResults: {
      type: Array,
      default: () => [],
    },
    task: {
      type: Object,
      default: null,
    },
    isPolling: {
      type: Boolean,
      default: false,
    },
    isRestoredTask: {
      type: Boolean,
      default: false,
    },
    itemsPerPage: {
      type: Number,
      default: 10,
    },
  },
  emits: ['clear-memory', 'clear-results', 'view-detail', 'page-change'],
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
  },
  watch: {
    crawlResults() {
      this.currentPage = 1
    },
  },
  methods: {
    formatDateTime,
    getProgressWidth() {
      if (this.task && this.task.progress) {
        const progress = this.task.progress.replace('%', '')
        return `${Math.min(Math.max(parseInt(progress) || 0, 0), 100)}%`
      }
      return '100%'
    },
    getProgressText() {
      if (this.task && this.task.progress) {
        return `正在获取爬取结果... ${this.task.progress}`
      }
      return '正在获取爬取结果，请稍候...'
    },
    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      this.currentPage = page
      this.$emit('page-change', page)
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

.task-info p {
  margin: 0.5rem 0;
  color: #6c757d;
  text-align: left;
}

.error-text {
  color: #dc3545;
  font-weight: 500;
}

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
  background: linear-gradient(to right, var(--color-secondary), var(--color-primary));
  border-radius: 4px;
  transition: width 0.3s;
}

.polling-animation {
  width: 100%;
  background: linear-gradient(90deg, transparent, rgba(168, 230, 207, 0.5), transparent);
  animation: polling 2s ease-in-out infinite;
}

@keyframes polling {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 14px;
  color: #6c757d;
  text-align: center;
}

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

.literature-list {
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .status-header,
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .status-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
