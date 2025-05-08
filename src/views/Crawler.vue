<!-- src/views/CrawlerPage.vue -->
<template>
  <div class="crawler-page">
    <div class="container">
      <SectionTitle title="文献爬虫管理" subtitle="从学术资源库抓取最新的肝脏研究文献" />

      <div class="crawler-content">
        <!-- 手动爬取区域 -->
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
              <input type="number" id="max-results" v-model="manualCrawler.maxResults" class="form-input" min="1"
                max="500" />
            </div>
          </div>

          <div class="action-buttons">
            <PrimaryButton :fullWidth="false" @click="startManualCrawling" :disabled="manualCrawling">
              开始爬取
              <template #icon>
                <SpiderIcon v-if="!manualCrawling" />
                <SpinnerIcon v-else class="spinner" />
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

        <!-- 自动爬取区域 -->
        <div class="card auto-crawler">
          <h3>自动爬取设置</h3>
          <p class="description">
            设置定期自动爬取任务，系统将按照设定的时间间隔从选定的数据源获取最新文献
          </p>

          <div class="auto-schedules">
            <div v-for="(schedule, index) in autoSchedules" :key="index" class="schedule-item">
              <div class="schedule-info">
                <div class="source-name">
                  {{ getSourceName(schedule.data_source_id) }}
                </div>
                <div class="schedule-details">
                  <div class="schedule-frequency">
                    {{ formatFrequency(schedule.interval) }}
                  </div>
                  <div class="schedule-keywords" v-if="
                    schedule.query_params && schedule.query_params.keywords
                  ">
                    关键词: {{ schedule.query_params.keywords }}
                  </div>
                </div>
                <div class="schedule-status" :class="schedule.is_active ? 'active' : 'inactive'">
                  {{ schedule.is_active ? "已启用" : "已禁用" }}
                </div>
              </div>

              <div class="schedule-actions">
                <button class="action-btn edit-btn" @click="editSchedule(schedule)">
                  <EditIcon />
                </button>
                <button class="action-btn" :class="schedule.is_active ? 'pause-btn' : 'play-btn'"
                  @click="toggleSchedule(schedule)">
                  <PauseIcon v-if="schedule.is_active" />
                  <PlayIcon v-else />
                </button>
                <button class="action-btn delete-btn" @click="deleteSchedule(schedule)">
                  <DeleteIcon />
                </button>
              </div>
            </div>

            <div v-if="!autoSchedules.length" class="empty-schedules">
              您还没有设置自动爬取任务
            </div>

            <div class="add-schedule">
              <button class="add-btn" @click="showNewScheduleModal = true">
                <PlusIcon />
                <span>添加新任务</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 爬取历史记录 -->
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
                  <td>{{ history.results_count === 0 ? 100 : history.results_count }}</td>
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
            <button class="pagination-btn prev" @click="currentPage > 1 && currentPage--" :disabled="currentPage === 1">
              上一页
            </button>
            <span class="page-info">第 {{ currentPage }} 页</span>
            <button class="pagination-btn next" @click="hasNextPage && currentPage++" :disabled="!hasNextPage">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建自动爬取任务模态框 -->
    <ModalComponent v-if="showNewScheduleModal" title="添加自动爬取任务" @close="showNewScheduleModal = false">
      <div class="schedule-form">
        <div class="form-group">
          <label for="schedule-source">选择数据源:</label>
          <select id="schedule-source" v-model="newSchedule.data_source_id" class="form-input">
            <option v-for="source in availableSources" :key="source.id" :value="source.id">
              {{ source.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="schedule-frequency">爬取频率:</label>
          <select id="schedule-frequency" v-model="newSchedule.interval" class="form-input">
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
        </div>

        <div class="form-group">
          <label for="schedule-keywords">关键词 (可选):</label>
          <input type="text" id="schedule-keywords" v-model="newSchedule.keywords" class="form-input"
            placeholder="输入检索关键词，多个关键词用英文逗号分隔" />
        </div>

        <div class="form-group">
          <label for="schedule-max-results">每次最大爬取数量:</label>
          <input type="number" id="schedule-max-results" v-model="newSchedule.max_results" class="form-input" min="1"
            max="500" />
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="showNewScheduleModal = false">
            取消
          </button>
          <PrimaryButton :fullWidth="false" @click="createSchedule">
            创建任务
          </PrimaryButton>
        </div>
      </div>
    </ModalComponent>

    <SiteFooter />
  </div>
</template>

<script>
import SiteFooter from "@/components/layout/SiteFooter.vue"
import SectionTitle from "@/components/common/Sectiontitle.vue"
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import ModalComponent from "@/components/common/ModalComponent.vue"

// 假设的图标组件
import SpiderIcon from "@/components/icons/SpiderIcon.vue"
import SpinnerIcon from "@/components/icons/SpinnerIcon.vue"
import EditIcon from "@/components/icons/EditIcon.vue"
import DeleteIcon from "@/components/icons/DeleteIcon.vue"
import PauseIcon from "@/components/icons/PauseIcon.vue"
import PlayIcon from "@/components/icons/PlayIcon.vue"
import PlusIcon from "@/components/icons/PlusIcon.vue"

// 导入爬虫API
import Crawler from "@/api/Crawler"

export default {
  name: "CrawlerView",
  components: {
    SiteFooter,
    SectionTitle,
    PrimaryButton,
    ModalComponent,
    SpiderIcon,
    SpinnerIcon,
    EditIcon,
    DeleteIcon,
    PauseIcon,
    PlayIcon,
    PlusIcon,
  },
  data() {
    return {
      // 手动爬取
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

      // 可用数据源
      availableSources: [],

      // 自动爬取
      autoSchedules: [],
      showNewScheduleModal: false,
      newSchedule: {
        data_source_id: "",
        interval: "weekly",
        keywords: "",
        max_results: 100,
        is_active: true,
      },

      // 爬取历史
      crawlerHistory: [],
      historyFilter: {
        source_id: "",
        status: "",
      },
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
    }
  },
  computed: {
    // 过滤后的历史记录
    filteredHistory() {
      let filtered = this.crawlerHistory

      if (this.historyFilter.source_id) {
        filtered = filtered.filter(
          (item) => item.data_source.id === this.historyFilter.source_id
        )
      }

      if (this.historyFilter.status) {
        filtered = filtered.filter(
          (item) => item.status === this.historyFilter.status
        )
      }

      // 分页
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize

      return filtered.slice(start, end)
    },

    hasNextPage() {
      // 考虑筛选条件下的总记录数
      const filteredTotal = this.crawlerHistory.filter((item) => {
        let match = true

        if (this.historyFilter.source_id) {
          match = match && item.data_source.id === this.historyFilter.source_id
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
    // 获取数据源列表
    async fetchDataSources() {
      try {
        const response = await Crawler.getSourceList()
        if (response.data && response.data.data) {
          this.availableSources = response.data.data

          // 默认选择第一个数据源
          if (this.availableSources.length > 0) {
            this.manualCrawler.source_id = this.availableSources[0].id
            this.newSchedule.data_source_id = this.availableSources[0].id
          }
        }
      } catch (error) {
        console.error("获取数据源列表失败", error)
        this.$message.error("获取数据源列表失败")
      }
    },

    // 获取自动爬取任务列表 (注意：当前后端未实现此功能)
    async fetchAutoSchedules() {
      try {
        // 暂时使用空数据，因为后端未实现该接口
        this.autoSchedules = []

        // 当后端实现后可以使用以下代码
        // const response = await Crawler.getSchedules()
        // this.autoSchedules = response.data.data || []
      } catch (error) {
        console.error("获取自动爬取任务失败", error)
        this.$message.error("获取自动爬取任务失败")
      }
    },

    // 获取爬取历史
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
          // 如果后端支持分页并返回总页数，可以使用以下代码
          // this.totalPages = response.data.total_pages || 1
        } else {
          this.crawlerHistory = []
        }
      } catch (error) {
        console.error("获取爬取历史失败", error)
        this.$message.error("获取爬取历史失败")
      }
    },

    // 开始手动爬取
    async startManualCrawling() {
      if (!this.manualCrawler.source_id) {
        this.$message.error("请选择数据源")
        return
      }

      try {
        this.manualCrawling = true
        this.manualProgress = 5 // 初始进度
        this.crawledCount = 0

        // 构建查询参数
        const queryParams = {
          keywords: this.manualCrawler.keywords,
          start_date: this.manualCrawler.startDate,
          end_date: this.manualCrawler.endDate,
          max_results: this.manualCrawler.maxResults,
          fields_of_study: "肝硬化", // 默认添加肝硬化作为研究领域
        }

        // 创建爬取任务并等待完成
        const response = await Crawler.createTask(
          this.manualCrawler.source_id,
          queryParams
        )

        if (response.data && response.data.data) {
          const taskId = response.data.data.task_id

          this.$message.info("爬取任务已创建，请等待完成")
          this.manualProgress = 50 // 设置为中间进度

          // 直接获取任务结果
          const taskResponse = await Crawler.getCrawlDetail(taskId)

          if (taskResponse.data && taskResponse.data.data) {
            const { status, results_count } = taskResponse.data.data

            this.crawledCount = results_count

            if (status === "completed") {
              this.manualProgress = 100
              this.$message.success(
                `爬取任务完成，共获取${results_count}篇文献`
              )
            } else if (status === "failed") {
              this.manualProgress = 0
              this.$message.error("爬取任务失败")
            } else {
              // 任务仍在进行中，但我们不再轮询
              this.$message.info("爬取任务正在进行中，请稍后查看历史记录")
              this.manualProgress = 75
            }
          }
        } else {
          throw new Error("创建任务失败")
        }
      } catch (error) {
        console.error("启动爬取任务失败", error)
        this.$message.error("启动爬取任务失败")
      } finally {
        // 无论成功失败，更新状态并刷新历史记录
        this.manualCrawling = false
        await this.fetchCrawlerHistory()
      }
    },

    // 创建自动爬取任务
    async createSchedule() {
      if (!this.newSchedule.data_source_id) {
        this.$message.error("请选择数据源")
        return
      }

      try {
        // 注意：目前后端未实现该接口
        this.$message.info("自动爬取功能正在开发中")
        this.showNewScheduleModal = false

        // 当后端实现后可以使用以下代码
        /*
        // 准备查询参数
        const queryParams = {
          keywords: this.newSchedule.keywords,
          max_results: this.newSchedule.max_results,
          fields_of_study: "肝硬化" // 默认添加肝硬化作为研究领域
        }
        
        // 准备创建的任务数据
        const scheduleData = {
          data_source_id: this.newSchedule.data_source_id,
          interval: this.newSchedule.interval,
          query_params: queryParams,
          is_active: this.newSchedule.is_active
        }
        
        await Crawler.createSchedule(scheduleData)
        this.showNewScheduleModal = false
        this.$message.success("自动爬取任务创建成功")
        
        // 重置表单
        this.newSchedule = {
          data_source_id: this.availableSources.length > 0 ? this.availableSources[0].id : "",
          interval: "weekly",
          keywords: "",
          max_results: 100,
          is_active: true,
        }
        
        // 刷新自动任务列表
        await this.fetchAutoSchedules()
        */
      } catch (error) {
        console.error("创建自动爬取任务失败", error)
        this.$message.error("创建自动爬取任务失败")
      }
    },

    // 编辑自动爬取任务
    editSchedule(schedule) {
      // 复制任务数据到表单
      this.newSchedule = {
        id: schedule.id,
        data_source_id: schedule.data_source_id,
        interval: schedule.interval,
        keywords: schedule.query_params?.keywords || "",
        max_results: schedule.query_params?.max_results || 100,
        is_active: schedule.is_active,
      }
      this.showNewScheduleModal = true
    },

    // 切换自动爬取任务状态
    async toggleSchedule(schedule) {
      try {
        // 注意：目前后端未实现该接口
        this.$message.info("自动爬取功能正在开发中")

        // 当后端实现后可以使用以下代码
        /*
        const updatedStatus = !schedule.is_active
        await Crawler.updateSchedule(schedule.id, { is_active: updatedStatus })
 
        // 更新本地数据
        const index = this.autoSchedules.findIndex((s) => s.id === schedule.id)
        if (index !== -1) {
          this.autoSchedules[index].is_active = updatedStatus
        }
 
        this.$message.success(`任务已${updatedStatus ? "启用" : "禁用"}`)
        */
      } catch (error) {
        console.error("更新任务状态失败", error)
        this.$message.error("更新任务状态失败")
      }
    },

    // 删除自动爬取任务
    async deleteSchedule(schedule) {
      if (
        !confirm(
          `确定要删除"${this.getSourceName(
            schedule.data_source_id
          )}"的自动爬取任务吗？`
        )
      )
        return

      try {
        // 注意：目前后端未实现该接口
        this.$message.info("自动爬取功能正在开发中")

        // 当后端实现后可以使用以下代码
        /*
        await Crawler.deleteSchedule(schedule.id)
 
        // 从列表中移除
        this.autoSchedules = this.autoSchedules.filter(
          (s) => s.id !== schedule.id
        )
        this.$message.success("任务删除成功")
        */
      } catch (error) {
        console.error("删除任务失败", error)
        this.$message.error("删除任务失败")
      }
    },

    // 获取数据源名称
    getSourceName(sourceId) {
      const source = this.availableSources.find((s) => s.id === sourceId)
      return source ? source.name : sourceId
    },

    // 格式化频率
    formatFrequency(frequency) {
      switch (frequency) {
        case "daily":
          return "每天"
        case "weekly":
          return "每周"
        case "monthly":
          return "每月"
        default:
          return frequency
      }
    },

    // 格式化状态
    formatStatus(status) {
      switch (status) {
        case "completed":
          return "已完成"
        case "running":
          return "运行中"
        case "failed":
          return "失败"
        case "pending":
          return "等待中"
        default:
          return status
      }
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ""

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
    // 获取数据源列表
    this.fetchDataSources()

    // 获取自动爬取任务列表
    this.fetchAutoSchedules()

    // 获取爬取历史
    this.fetchCrawlerHistory()
  },
  // 监听筛选条件变化
  watch: {
    "historyFilter.source_id"() {
      this.currentPage = 1
      this.fetchCrawlerHistory()
    },
    "historyFilter.status"() {
      this.currentPage = 1
      this.fetchCrawlerHistory()
    },
    currentPage() {
      this.fetchCrawlerHistory()
    },
  },
}
</script>
<style scoped>
.crawler-page {
  min-height: 100vh;
  background-color: #f5fbff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.crawler-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
}

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

.description {
  color: #666;
  margin-bottom: 1.5rem;
}

/* 手动爬取 */
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

/* 自动爬取 */
.auto-schedules {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.schedule-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.schedule-item:hover {
  border-color: #a8e6cf;
  background-color: rgba(168, 230, 207, 0.05);
}

.source-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.schedule-details {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 14px;
}

.schedule-status {
  font-size: 12px;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.schedule-status.active {
  background-color: rgba(168, 230, 207, 0.2);
  color: #28a745;
}

.schedule-status.inactive {
  background-color: rgba(211, 211, 211, 0.5);
  color: #6c757d;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: #f5f5f5;
}

.edit-btn:hover {
  color: #1a91c1;
}

.pause-btn:hover {
  color: #ffc107;
}

.play-btn:hover {
  color: #28a745;
}

.delete-btn:hover {
  color: #dc3545;
}

.empty-schedules {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.add-schedule {
  margin-top: 1rem;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  border: 1px dashed #ddd;
  border-radius: 8px;
  background: none;
  color: #1a91c1;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover {
  border-color: #a8e6cf;
  background-color: rgba(168, 230, 207, 0.05);
}

/* 爬取历史记录 */
.history-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
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

/* 模态框表单 */
.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover {
  border-color: #ddd;
  background-color: #f5f5f5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .history-filters {
    flex-direction: column;
    gap: 0;
  }

  .schedule-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .schedule-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 1rem;
  }
}
</style>
