four Vue files. Let me do this systematically for each file. AutoCrawler.vue
Code ProfileForm.vue Code ManualCrawler.vue Code CollectionDetail.vue Code
我已经将四个Vue文件中的自定义图标组件替换为Element
Plus的图标组件。以下是对每个文件所做的主要更改： 1. AutoCrawler.vue
原始图标组件： EditIcon DeleteIcon PauseIcon PlayIcon PlusIcon 替换为Element
Plus图标：

<Edit />
<Delete />
<VideoPause />
<VideoPlay />

<!-- src/components/crawl/AutoCrawler.vue -->
<template>
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
            <div class="schedule-keywords" v-if="schedule.query_params && schedule.query_params.keywords">
              关键词: {{ schedule.query_params.keywords }}
            </div>
          </div>
          <div class="schedule-status" :class="schedule.is_active ? 'active' : 'inactive'">
            {{ schedule.is_active ? "已启用" : "已禁用" }}
          </div>
        </div>

        <div class="schedule-actions">
          <button class="action-btn edit-btn" @click="editSchedule(schedule)">
            <el-icon>
              <Edit />
            </el-icon>
          </button>
          <button class="action-btn" :class="schedule.is_active ? 'pause-btn' : 'play-btn'"
            @click="toggleSchedule(schedule)">
            <el-icon v-if="schedule.is_active">
              <VideoPause />
            </el-icon>
            <el-icon v-else>
              <VideoPlay />
            </el-icon>
          </button>
          <button class="action-btn delete-btn" @click="deleteSchedule(schedule)">
            <el-icon>
              <Delete />
            </el-icon>
          </button>
        </div>
      </div>

      <div v-if="!autoSchedules.length" class="empty-schedules">
        您还没有设置自动爬取任务
      </div>

      <div class="add-schedule">
        <button class="add-btn" @click="showNewScheduleModal = true">
          <el-icon>
            <Plus />
          </el-icon>
          <span>添加新任务</span>
        </button>
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
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import ModalComponent from "@/components/common/ModalComponent.vue"
import {
  Edit,
  Delete,
  VideoPause,
  VideoPlay,
  Plus,
} from "@element-plus/icons-vue"

// 导入爬虫API
import Crawler from "@/api/Crawler"

export default {
  name: "AutoCrawler",
  components: {
    PrimaryButton,
    ModalComponent,
    Edit,
    Delete,
    VideoPause,
    VideoPlay,
    Plus,
  },
  props: {
    availableSources: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      autoSchedules: [],
      showNewScheduleModal: false,
      newSchedule: {
        data_source_id: "",
        interval: "weekly",
        keywords: "",
        max_results: 100,
        is_active: true,
      },
    }
  },
  watch: {
    availableSources: {
      handler(newSources) {
        if (newSources.length > 0 && !this.newSchedule.data_source_id) {
          this.newSchedule.data_source_id = newSources[0].id
        }
      },
      immediate: true,
    },
  },
  created() {
    this.fetchAutoSchedules()
  },
  methods: {
    // 获取自动爬取任务列表
    async fetchAutoSchedules() {
      try {
        // 暂时使用空数据，因为后端未实现该接口
        this.autoSchedules = []

        // 当后端实现后可以使用以下代码
        const response = await Crawler.getSchedules()
        this.autoSchedules = response.data.data || []
      } catch (error) {
        // console.error("获取自动爬取任务失败", error);
        // this.$message.error("获取自动爬取任务失败");
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
  },
}
</script>

<style scoped>
.auto-crawler {
  margin-bottom: 2rem;
}

.description {
  color: #666;
  margin-bottom: 1.5rem;
}

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

/* 表单样式 */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.2);
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
