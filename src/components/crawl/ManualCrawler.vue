<!-- src/components/crawl/ManualCrawler.vue -->
<template>
  <div class="card manual-crawler">
    <h3>手动爬取</h3>
    <div class="source-selector">
      <label for="source">选择数据源:</label>
      <select id="source" v-model="manualCrawler.source_id" class="select-input">
        <option v-for="source in availableSources" :key="source.id" :value="source.id">
          {{ source.name }}
        </option>
      </select>
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
            <Spider />
          </el-icon>
          <el-icon v-else class="spinner">
            <Loading />
          </el-icon>
        </template>
      </PrimaryButton>
    </div>

    <!-- 爬取进度 -->
    <div v-if="manualCrawling" class="crawling-progress">
      <div class="progress-bar">
        <div class="progress-value" :style="{ width: `${manualProgress}%` }"></div>
      </div>
      <div class="progress-text">
        {{ manualProgress }}% - 已爬取 {{ crawledCount }} 篇文献
      </div>
    </div>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import { Spider, Loading } from "@element-plus/icons-vue"

// 导入爬虫API
import Crawler from "@/api/Crawler"

export default {
  name: "ManualCrawler",
  components: {
    PrimaryButton,
    Spider,
    Loading,
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
        source_id: "",
        keywords: "",
        startDate: "",
        endDate: "",
        maxResults: 100,
      },
      manualCrawling: false,
      manualProgress: 0,
      crawledCount: 0,
      messageShown: false, // 添加消息标志位
    }
  },
  watch: {
    availableSources: {
      handler(newSources) {
        if (newSources.length > 0 && !this.manualCrawler.source_id) {
          this.manualCrawler.source_id = newSources[0].id
        }
      },
      immediate: true,
    },
  },
  methods: {
    // 显示消息并防止重复
    showMessage(type, content) {
      // 防止重复显示相同消息
      if (this.messageShown && this.lastMessage === content) {
        return
      }

      this.messageShown = true
      this.lastMessage = content
      this.$message[type](content)

      // 重置消息状态标志（可选，根据实际需求决定是否需要）
      setTimeout(() => {
        this.messageShown = false
      }, 500)
    },

    // 开始手动爬取
    async startManualCrawling() {
      if (this.manualCrawling) return // 防止重复点击

      if (!this.manualCrawler.source_id) {
        this.showMessage('error', "请选择数据源")
        return
      }

      try {
        this.manualCrawling = true
        this.manualProgress = 5 // 初始进度
        this.crawledCount = 0

        const queryParams = {
          keywords: this.manualCrawler.keywords,
          start_date: this.manualCrawler.startDate,
          end_date: this.manualCrawler.endDate,
          max_results: this.manualCrawler.maxResults,
        }

        // 创建任务
        this.showMessage('info', "爬取任务已创建，请等待完成")
        const response = await Crawler.createTask(
          this.manualCrawler.source_id,
          queryParams
        )

        if (response.data && response.data.data) {
          const taskId = response.data.data.task_id
          this.manualProgress = 50

          // 获取任务详情
          const taskResponse = await Crawler.getCrawlDetail(taskId)

          if (taskResponse.data && taskResponse.data.data) {
            const { status, results_count } = taskResponse.data.data
            this.crawledCount = results_count

            if (status === "completed") {
              this.manualProgress = 100
              this.showMessage('success', `爬取任务完成，共获取${results_count}篇文献`)
            } else if (status === "failed") {
              this.manualProgress = 0
              this.showMessage('error', "爬取任务失败")
            } else {
              this.manualProgress = 75
              this.showMessage('info', "爬取任务正在进行中，请稍后查看历史记录")
            }
          }
        } else {
          throw new Error("创建任务失败")
        }
      } catch (error) {
        console.error("启动爬取任务失败", error)
        this.showMessage('error', "启动爬取任务失败")
      } finally {
        this.manualCrawling = false
        this.$emit("crawl-completed")
      }
    },

    // 重置表单
    resetForm() {
      this.manualCrawler = {
        source_id:
          this.availableSources.length > 0 ? this.availableSources[0].id : "",
        keywords: "",
        startDate: "",
        endDate: "",
        maxResults: 100,
      }
      this.manualProgress = 0
      this.crawledCount = 0
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

.progress-bar {
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  margin-top: 1.5rem;
}

.progress-value {
  height: 100%;
  background: linear-gradient(to right, #a8e6cf, #1a91c1);
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}

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
}
</style>