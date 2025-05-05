<!-- src/views/CrawlerPage.vue -->
<template>
  <div class="crawler-page">
    <div class="container">
      <SectionTitle
        title="文献爬虫管理"
        subtitle="从学术资源库抓取最新的肝脏研究文献"
      />

      <div class="crawler-content">
        <!-- 手动爬取区域 -->
        <div class="card manual-crawler">
          <h3>手动爬取</h3>
          <div class="source-selector">
            <label for="source">选择数据源:</label>
            <select
              id="source"
              v-model="manualCrawler.source"
              class="select-input"
            >
              <option
                v-for="source in availableSources"
                :key="source.id"
                :value="source.id"
              >
                {{ source.name }}
              </option>
            </select>
          </div>

          <div class="query-section">
            <div class="form-group">
              <label for="keywords">关键词:</label>
              <input
                type="text"
                id="keywords"
                v-model="manualCrawler.keywords"
                class="form-input"
                placeholder="输入检索关键词，多个关键词用英文逗号分隔"
              />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="start-date">起始日期:</label>
                <input
                  type="date"
                  id="start-date"
                  v-model="manualCrawler.startDate"
                  class="form-input"
                />
              </div>

              <div class="form-group flex-1">
                <label for="end-date">结束日期:</label>
                <input
                  type="date"
                  id="end-date"
                  v-model="manualCrawler.endDate"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="max-results">最大结果数:</label>
              <input
                type="number"
                id="max-results"
                v-model="manualCrawler.maxResults"
                class="form-input"
                min="1"
                max="500"
              />
            </div>
          </div>

          <div class="action-buttons">
            <PrimaryButton
              :fullWidth="false"
              @click="startManualCrawling"
              :disabled="manualCrawling"
            >
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
              <div
                class="progress-value"
                :style="{ width: `${manualProgress}%` }"
              ></div>
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
            <div
              v-for="(schedule, index) in autoSchedules"
              :key="index"
              class="schedule-item"
            >
              <div class="schedule-info">
                <div class="source-name">
                  {{ getSourceName(schedule.source_id) }}
                </div>
                <div class="schedule-details">
                  <div class="schedule-frequency">
                    {{ formatFrequency(schedule.frequency) }}
                  </div>
                  <div class="schedule-keywords" v-if="schedule.keywords">
                    关键词: {{ schedule.keywords }}
                  </div>
                </div>
                <div
                  class="schedule-status"
                  :class="schedule.active ? 'active' : 'inactive'"
                >
                  {{ schedule.active ? "已启用" : "已禁用" }}
                </div>
              </div>

              <div class="schedule-actions">
                <button
                  class="action-btn edit-btn"
                  @click="editSchedule(schedule)"
                >
                  <EditIcon />
                </button>
                <button
                  class="action-btn"
                  :class="schedule.active ? 'pause-btn' : 'play-btn'"
                  @click="toggleSchedule(schedule)"
                >
                  <PauseIcon v-if="schedule.active" />
                  <PlayIcon v-else />
                </button>
                <button
                  class="action-btn delete-btn"
                  @click="deleteSchedule(schedule)"
                >
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
              <select
                id="history-source"
                v-model="historyFilter.source"
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
              <label for="history-type">爬取类型:</label>
              <select
                id="history-type"
                v-model="historyFilter.type"
                class="select-input"
              >
                <option value="">全部</option>
                <option value="manual">手动爬取</option>
                <option value="auto">自动爬取</option>
              </select>
            </div>
          </div>

          <div class="history-table">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>数据源</th>
                  <th>类型</th>
                  <th>关键词</th>
                  <th>爬取数量</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(history, index) in filteredHistory" :key="index">
                  <td>{{ formatDate(history.created_at) }}</td>
                  <td>{{ getSourceName(history.source_id) }}</td>
                  <td>{{ history.type === "manual" ? "手动" : "自动" }}</td>
                  <td>{{ history.keywords || "无" }}</td>
                  <td>{{ history.document_count }}</td>
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
              @click="currentPage > 1 && currentPage--"
              :disabled="currentPage === 1"
            >
              上一页
            </button>
            <span class="page-info">第 {{ currentPage }} 页</span>
            <button
              class="pagination-btn next"
              @click="hasNextPage && currentPage++"
              :disabled="!hasNextPage"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建自动爬取任务模态框 -->
    <ModalComponent
      v-if="showNewScheduleModal"
      title="添加自动爬取任务"
      @close="showNewScheduleModal = false"
    >
      <div class="schedule-form">
        <div class="form-group">
          <label for="schedule-source">选择数据源:</label>
          <select
            id="schedule-source"
            v-model="newSchedule.source_id"
            class="form-input"
          >
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
          <label for="schedule-frequency">爬取频率:</label>
          <select
            id="schedule-frequency"
            v-model="newSchedule.frequency"
            class="form-input"
          >
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
        </div>

        <div class="form-group">
          <label for="schedule-keywords">关键词 (可选):</label>
          <input
            type="text"
            id="schedule-keywords"
            v-model="newSchedule.keywords"
            class="form-input"
            placeholder="输入检索关键词，多个关键词用英文逗号分隔"
          />
        </div>

        <div class="form-group">
          <label for="schedule-max-results">每次最大爬取数量:</label>
          <input
            type="number"
            id="schedule-max-results"
            v-model="newSchedule.max_results"
            class="form-input"
            min="1"
            max="500"
          />
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="cancel-btn"
            @click="showNewScheduleModal = false"
          >
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
import SiteFooter from "@/components/layout/SiteFooter.vue";
import SectionTitle from "@/components/common/Sectiontitle.vue";
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";
import ModalComponent from "@/components/common/ModalComponent.vue";

// 假设的图标组件
import SpiderIcon from "@/components/icons/SpiderIcon.vue";
import SpinnerIcon from "@/components/icons/SpinnerIcon.vue";
import EditIcon from "@/components/icons/EditIcon.vue";
import DeleteIcon from "@/components/icons/DeleteIcon.vue";
import PauseIcon from "@/components/icons/PauseIcon.vue";
import PlayIcon from "@/components/icons/PlayIcon.vue";
import PlusIcon from "@/components/icons/PlusIcon.vue";

// 假设我们有一个专门的爬虫API
import Crawler from "@/api/Crawler";

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
        source: "",
        keywords: "",
        startDate: "",
        endDate: "",
        maxResults: 100,
      },
      manualCrawling: false,
      manualProgress: 0,
      crawledCount: 0,

      // 可用数据源
      availableSources: [
        { id: "pubmed", name: "PubMed" },
        { id: "arxiv", name: "arXiv" },
        { id: "medrxiv", name: "medRxiv" },
        { id: "biorxiv", name: "bioRxiv" },
        { id: "sciencedirect", name: "ScienceDirect" },
      ],

      // 自动爬取
      autoSchedules: [],
      showNewScheduleModal: false,
      newSchedule: {
        source_id: "",
        frequency: "weekly",
        keywords: "",
        max_results: 100,
        active: true,
      },

      // 爬取历史
      crawlerHistory: [],
      historyFilter: {
        source: "",
        type: "",
      },
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
    };
  },
  computed: {
    // 过滤后的历史记录
    filteredHistory() {
      let filtered = this.crawlerHistory;

      if (this.historyFilter.source) {
        filtered = filtered.filter(
          (item) => item.source_id === this.historyFilter.source
        );
      }

      if (this.historyFilter.type) {
        filtered = filtered.filter(
          (item) => item.type === this.historyFilter.type
        );
      }

      // 分页
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;

      return filtered.slice(start, end);
    },

    hasNextPage() {
      // const filteredTotal = this.crawlerHistory.filter((item) => {
      //   let match = true;

      //   if (this.historyFilter.source) {
      //     match = match && item.source_id === this.historyFilter.source;
      //   }

      //   if (this.historyFilter.type) {
      //     match = match && item.type === this.historyFilter.type;
      //   }

      //   return match;
      // }).length;

      return this.currentPage * this.pageSize;
    },
  },
  methods: {
    async fetchAutoSchedules() {
      try {
        const response = await Crawler.getSchedules();
        this.autoSchedules = response.data.items || [];
      } catch (error) {
        console.error("获取自动爬取任务失败", error);
        this.$toast.error("获取自动爬取任务失败");
      }
    },

    async fetchCrawlerHistory() {
      try {
        const response = await Crawler.getHistory({
          page: this.currentPage,
          size: this.pageSize,
        });
        this.crawlerHistory = response.data.items || [];
        this.totalPages = response.data.total_pages || 1;
      } catch (error) {
        console.error("获取爬取历史失败", error);
        this.$toast.error("获取爬取历史失败");
      }
    },

    async startManualCrawling() {
      if (!this.manualCrawler.source) {
        this.$toast.error("请选择数据源");
        return;
      }

      try {
        this.manualCrawling = true;
        this.manualProgress = 0;
        this.crawledCount = 0;

        // 创建爬取任务
        const response = await Crawler.createCrawlingTask({
          source_id: this.manualCrawler.source,
          keywords: this.manualCrawler.keywords,
          start_date: this.manualCrawler.startDate,
          end_date: this.manualCrawler.endDate,
          max_results: this.manualCrawler.maxResults,
          type: "manual",
        });

        const taskId = response.data.task_id;

        // 模拟进度更新 (在实际应用中，您可能需要使用WebSocket或轮询API获取实时进度)
        this.updateProgressInterval = setInterval(() => {
          this.checkCrawlingProgress(taskId);
        }, 2000);
      } catch (error) {
        console.error("启动爬取任务失败", error);
        this.$toast.error("启动爬取任务失败");
        this.manualCrawling = false;
      }
    },

    async checkCrawlingProgress(taskId) {
      try {
        const response = await Crawler.getTaskProgress(taskId);
        const { progress, document_count, status } = response.data;

        this.manualProgress = progress;
        this.crawledCount = document_count;

        if (status === "completed" || status === "failed" || progress >= 100) {
          clearInterval(this.updateProgressInterval);
          this.manualCrawling = false;

          if (status === "completed") {
            this.$toast.success(`爬取任务完成，共获取${document_count}篇文献`);
          } else if (status === "failed") {
            this.$toast.error("爬取任务失败");
          }

          // 刷新历史记录
          await this.fetchCrawlerHistory();
        }
      } catch (error) {
        console.error("获取任务进度失败", error);
        clearInterval(this.updateProgressInterval);
        this.manualCrawling = false;
      }
    },

    async createSchedule() {
      if (!this.newSchedule.source_id) {
        this.$toast.error("请选择数据源");
        return;
      }

      try {
        await Crawler.createSchedule(this.newSchedule);
        this.showNewScheduleModal = false;
        this.$toast.success("自动爬取任务创建成功");

        // 重置表单
        this.newSchedule = {
          source_id: "",
          frequency: "weekly",
          keywords: "",
          max_results: 100,
          active: true,
        };

        // 刷新自动任务列表
        await this.fetchAutoSchedules();
      } catch (error) {
        console.error("创建自动爬取任务失败", error);
        this.$toast.error("创建自动爬取任务失败");
      }
    },

    editSchedule(schedule) {
      // 复制任务数据到表单
      this.newSchedule = { ...schedule };
      this.showNewScheduleModal = true;
    },

    async toggleSchedule(schedule) {
      try {
        const updatedStatus = !schedule.active;
        await Crawler.updateSchedule(schedule.id, { active: updatedStatus });

        // 更新本地数据
        const index = this.autoSchedules.findIndex((s) => s.id === schedule.id);
        if (index !== -1) {
          this.autoSchedules[index].active = updatedStatus;
        }

        this.$toast.success(`任务已${updatedStatus ? "启用" : "禁用"}`);
      } catch (error) {
        console.error("更新任务状态失败", error);
        this.$toast.error("更新任务状态失败");
      }
    },

    async deleteSchedule(schedule) {
      if (
        !confirm(
          `确定要删除"${this.getSourceName(
            schedule.source_id
          )}"的自动爬取任务吗？`
        )
      )
        return;

      try {
        await Crawler.deleteSchedule(schedule.id);

        // 从列表中移除
        this.autoSchedules = this.autoSchedules.filter(
          (s) => s.id !== schedule.id
        );
        this.$toast.success("任务删除成功");
      } catch (error) {
        console.error("删除任务失败", error);
        this.$toast.error("删除任务失败");
      }
    },

    getSourceName(sourceId) {
      const source = this.availableSources.find((s) => s.id === sourceId);
      return source ? source.name : sourceId;
    },

    formatFrequency(frequency) {
      switch (frequency) {
        case "daily":
          return "每天";
        case "weekly":
          return "每周";
        case "monthly":
          return "每月";
        default:
          return frequency;
      }
    },

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
    this.fetchAutoSchedules();
    this.fetchCrawlerHistory();

    // 默认选择第一个数据源
    if (this.availableSources.length > 0) {
      this.manualCrawler.source = this.availableSources[0].id;
    }
  },
  beforeUnmount() {
    // 清除定时器
    if (this.updateProgressInterval) {
      clearInterval(this.updateProgressInterval);
    }
  },
};
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
  margin-top: 0.5rem;
}

.schedule-status.active {
  background-color: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.schedule-status.inactive {
  background-color: rgba(189, 195, 199, 0.1);
  color: #7f8c8d;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  display: flex;
  cursor: pointer;
  color: #777;
  border-radius: 4px;
  transition: all 0.2s;
}

.edit-btn:hover {
  color: #1a91c1;
  background-color: rgba(26, 145, 193, 0.1);
}

.pause-btn:hover {
  color: #f39c12;
  background-color: rgba(243, 156, 18, 0.1);
}

.play-btn:hover {
  color: #2ecc71;
  background-color: rgba(46, 204, 113, 0.1);
}

.delete-btn:hover {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
}

.empty-schedules {
  text-align: center;
  padding: 2rem;
  color: #777;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.add-schedule {
  margin-top: 1rem;
}

.add-btn {
  width: 100%;
  padding: 0.75rem;
  border: 1px dashed #ccc;
  background: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #1a91c1;
  transition: all 0.3s;
}

.add-btn:hover {
  border-color: #a8e6cf;
  background-color: rgba(168, 230, 207, 0.05);
}

/* 爬取历史 */
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
  margin-bottom: 1rem;
}

thead {
  background-color: rgba(168, 230, 207, 0.1);
}

th,
td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 600;
  color: #444;
}

td {
  font-size: 14px;
}

td.completed {
  color: #2ecc71;
}

td.running {
  color: #1a91c1;
}

td.failed {
  color: #e74c3c;
}

td.pending {
  color: #f39c12;
}

.empty-history {
  text-align: center;
  padding: 2rem;
  color: #777;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
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
  background: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: rgba(168, 230, 207, 0.1);
  border-color: #a8e6cf;
  color: #1a91c1;
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
  width: 100%;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  color: #555;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }

  .history-filters {
    flex-direction: column;
  }

  .schedule-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .schedule-actions {
    margin-top: 1rem;
    align-self: flex-end;
  }
}
</style>
