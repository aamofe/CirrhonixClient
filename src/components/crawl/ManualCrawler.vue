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
        <input type="text" id="keywords" v-model="manualCrawler.keywords" class="form-input" placeholder="输入检索关键词" />
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

    <!-- 使用新的爬虫结果展示组件 -->
    <CrawlResults :crawl-results="crawlResults" :task="currentTask" :is-polling="isPolling"
      :is-restored-task="isRestoredTask" :items-per-page="10" @clear-memory="clearMemoryTask"
      @clear-results="clearResults" @view-detail="viewArticleDetail" @page-change="handlePageChange" />
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import CrawlResults from "@/components/crawl/CrawlResults.vue"
import { Search, Loading } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import Crawler from "@/api/Crawler"

export default {
  name: "ManualCrawler",
  components: {
    PrimaryButton,
    CrawlResults,
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
        source_ids: [],
        keywords: "",
        startDate: "",
        endDate: "",
        maxResults: 100,
      },
      manualCrawling: false,
      currentTask: null,
      crawlResults: [],
      isPolling: false,
      pollingTimer: null,
      messageShown: false,
      lastMessage: "",
      isRestoredTask: false,
    }
  },
  watch: {
    availableSources: {
      handler(newSources) {
        if (newSources.length > 0 && this.manualCrawler.source_ids.length === 0) {
          this.manualCrawler.source_ids = [newSources[0].id]
        }
      },
      immediate: true,
    },

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
    this.restoreTaskFromMemory()
  },
  beforeUnmount() {
    this.stopPolling()
  },
  methods: {
    // 任务记忆相关方法
    saveTaskToMemory(taskId) {
      if (taskId) {
        sessionStorage.setItem('manualCrawlerTaskId', taskId)
      }
    },

    getSavedTaskId() {
      return sessionStorage.getItem('manualCrawlerTaskId')
    },

    async restoreTaskFromMemory() {
      const savedTaskId = this.getSavedTaskId()

      if (savedTaskId) {
        try {
          await this.loadTaskById(savedTaskId)

          if (this.currentTask) {
            this.isRestoredTask = true
          }
        } catch (error) {
          this.clearTaskMemory()
          this.showMessage('warning', '无法恢复之前的任务，可能任务已过期')
        }
      } else {
        try {
          const response = await Crawler.getCrawlList(null, null, 1, 10)
          if (response.data && response.data.data) {
            this.currentTask = response.data.data[0]
            if (this.currentTask && Array.isArray(this.currentTask.literature)) {
              this.crawlResults = this.currentTask.literature
            }
            if (['pending', 'running', 'queued'].includes(this.currentTask.status)) {
              this.startPolling(this.currentTask.id)
            }
          }
        } catch (error) {
          console.error('获取最近爬虫记录失败:', error)
        }
      }
    },

    async loadTaskById(taskId) {
      try {
        const response = await Crawler.getCrawlDetail(taskId)

        if (response.data && response.data.data) {
          this.currentTask = response.data.data

          if (this.currentTask && Array.isArray(this.currentTask.literature)) {
            this.crawlResults = this.currentTask.literature
          }

          if (['pending', 'running', 'queued'].includes(this.currentTask.status)) {
            this.startPolling(taskId)
          }

          return this.currentTask
        } else {
          throw new Error('任务不存在或数据格式错误')
        }
      } catch (error) {
        throw error
      }
    },

    clearTaskMemory() {
      sessionStorage.removeItem('manualCrawlerTaskId')
    },

    clearMemoryTask() {
      this.clearTaskMemory()
      this.currentTask = null
      this.crawlResults = []
      this.isRestoredTask = false
      this.stopPolling()
      this.showMessage('info', '已清除记忆任务')
    },

    // 消息提示
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
        this.isRestoredTask = false

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
          this.startPolling(this.currentTask.id)
        } else {
          throw new Error("创建任务失败")
        }
      } catch (error) {
        this.showMessage('error', "启动爬取任务失败: " + (error.message || "未知错误"))
      } finally {
        this.manualCrawling = false
      }
    },

    // 轮询相关方法
    startPolling(taskId) {
      this.isPolling = true
      this.pollingTimer = setInterval(async () => {
        try {
          await this.checkTaskStatus(taskId)
        } catch (error) {
          this.stopPolling()
          this.showMessage('error', "获取任务状态失败")
        }
      }, 10000)
    },

    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
      this.isPolling = false
    },

    async checkTaskStatus(taskId) {
      try {
        const response = await Crawler.getCrawlDetail(taskId)

        if (response.data) {
          this.currentTask = response.data.data

          if (this.currentTask && Array.isArray(this.currentTask.literature)) {
            this.crawlResults = this.currentTask.literature
          }

          if (['completed', 'failed'].includes(this.currentTask.status)) {
            this.stopPolling()

            if (this.currentTask.status === 'completed') {
              const count = this.currentTask.results_count || 0
              this.showMessage('success', `爬取任务完成，共获取 ${count} 篇文献`)
            } else if (this.currentTask.status === 'failed') {
              this.showMessage('error', "爬取任务失败: " + (this.currentTask.error_message || "未知错误"))
            }
          }
        }
      } catch (error) {
        throw error
      }
    },

    // 事件处理方法
    viewArticleDetail(id) {
      if (this.currentTask && this.currentTask.id) {
        this.saveTaskToMemory(this.currentTask.id)
      }

      this.$router.push({
        name: "literature-detail",
        params: { id },
      })
    },

    clearResults() {
      this.crawlResults = []
      this.currentTask = null
      this.isRestoredTask = false
      this.clearTaskMemory()
    },

    handlePageChange(page) {
      // 保存任务记忆
      if (this.currentTask && this.currentTask.id) {
        this.saveTaskToMemory(this.currentTask.id)
      }
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
      this.isRestoredTask = false
      this.stopPolling()
      this.clearTaskMemory()
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
}
</style>