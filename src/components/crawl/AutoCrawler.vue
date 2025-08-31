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
          <div class="schedule-header">
            <div class="schedule-name">
              {{ schedule.name }}
            </div>
            <div class="schedule-status" :class="schedule.is_active ? 'active' : 'inactive'">
              {{ schedule.is_active ? "已启用" : "已禁用" }}
            </div>
          </div>

          <div class="schedule-details">
            <div class="schedule-source">
              <span class="label">数据源:</span>
              {{ formatDataSources(schedule.data_sources) }}
            </div>
            <div class="schedule-frequency">
              <span class="label">频率:</span>
              {{ schedule.interval_display || formatFrequency(schedule.interval) }}
            </div>
            <div class="schedule-keywords" v-if="schedule.query_params && schedule.query_params.keywords">
              <span class="label">关键词:</span>
              {{ schedule.query_params.keywords }}
            </div>
            <div class="schedule-description" v-if="schedule.description">
              <span class="label">描述:</span>
              {{ schedule.description }}
            </div>
          </div>

          <div class="schedule-stats">
            <div class="stat-item">
              <span class="stat-label">总运行次数:</span>
              <span class="stat-value">{{ schedule.total_runs || 0 }}</span>
            </div>
            <div class="stat-item success">
              <span class="stat-label">成功:</span>
              <span class="stat-value">{{ schedule.success_runs || 0 }}</span>
            </div>
            <div class="stat-item failed" v-if="schedule.failed_runs > 0">
              <span class="stat-label">失败:</span>
              <span class="stat-value">{{ schedule.failed_runs }}</span>
            </div>
          </div>

          <div class="schedule-time-info">
            <div class="time-item" v-if="schedule.next_run">
              <span class="time-label">下次运行:</span>
              <span class="time-value">{{ formatDateTime(schedule.next_run) }}</span>
            </div>
            <div class="time-item" v-if="schedule.last_run">
              <span class="time-label">上次运行:</span>
              <span class="time-value">{{ formatDateTime(schedule.last_run) }}</span>
            </div>
            <div class="time-item">
              <span class="time-label">创建时间:</span>
              <span class="time-value">{{ formatDateTime(schedule.created_at) }}</span>
            </div>
            <div class="time-item" v-if="schedule.created_by">
              <span class="time-label">创建者:</span>
              <span class="time-value">{{ schedule.created_by }}</span>
            </div>
          </div>
        </div>

        <div class="schedule-actions">
          <button class="action-btn edit-btn" @click="editSchedule(schedule)" title="编辑">
            <el-icon>
              <Edit />
            </el-icon>
          </button>
          <button class="action-btn" :class="schedule.is_active ? 'pause-btn' : 'play-btn'"
            @click="toggleSchedule(schedule)" :title="schedule.is_active ? '暂停' : '启用'">
            <el-icon v-if="schedule.is_active">
              <VideoPause />
            </el-icon>
            <el-icon v-else>
              <VideoPlay />
            </el-icon>
          </button>
          <button class="action-btn trigger-btn" @click="triggerScheduleNow(schedule)" title="立即执行">
            <el-icon>
              <CaretRight />
            </el-icon>
          </button>
          <button class="action-btn delete-btn" @click="deleteSchedule(schedule)" title="删除">
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

    <ModalComponent v-if="showNewScheduleModal" :title="newSchedule.id ? '编辑自动爬取任务' : '添加自动爬取任务'"
      @close="showNewScheduleModal = false">
      <div class="schedule-form">
        <div class="form-group">
          <label for="schedule-name">任务名称:</label>
          <input type="text" id="schedule-name" v-model="newSchedule.name" class="form-input" placeholder="请输入任务名称"
            required />
        </div>

        <div class="form-group">
          <label for="schedule-description">任务描述 (可选):</label>
          <textarea id="schedule-description" v-model="newSchedule.description" class="form-input" placeholder="请输入任务描述"
            rows="3"></textarea>
        </div>

        <div class="form-group">
          <label for="schedule-source">选择数据源:</label>
          <div class="multi-select-container">
            <div class="checkbox-group">
              <label v-for="source in availableSources" :key="source.id" class="checkbox-item">
                <input type="checkbox" :value="source.id" v-model="newSchedule.data_source_ids"
                  class="checkbox-input" />
                <span class="checkbox-label">{{ source.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="schedule-frequency">爬取频率:</label>
          <select id="schedule-frequency" v-model="newSchedule.interval" class="form-input">
            <option value="hourly">每小时</option>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
        </div>

        <div class="form-group">
          <label for="schedule-keywords">关键词:</label>
          <input type="text" id="schedule-keywords" v-model="newSchedule.keywords" class="form-input"
            placeholder="输入检索关键词，多个关键词用英文逗号分隔" required />
        </div>

        <div class="form-group">
          <label for="schedule-max-results">每次最大爬取数量:</label>
          <input type="number" id="schedule-max-results" v-model="newSchedule.max_results" class="form-input" min="1"
            max="500" />
        </div>

        <div class="form-actions">
          <CancelButton @click="showNewScheduleModal = false">
            取消
          </CancelButton>
          <PrimaryButton :fullWidth="false" @click="saveSchedule">
            {{ newSchedule.id ? "保存修改" : "创建任务" }}
          </PrimaryButton>
        </div>
      </div>
    </ModalComponent>
  </div>
</template>

<script>
import PrimaryButton from "@/components/ui/PrimaryButton.vue"
import CancelButton from "@/components/ui/CancelButton.vue"
import ModalComponent from "@/components/ui/BaseModal.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  Edit,
  Delete,
  VideoPause,
  VideoPlay,
  Plus,
  CaretRight
} from "@element-plus/icons-vue"

import Crawler from "@/api/Crawler"

export default {
  name: "AutoCrawler",
  components: {
    PrimaryButton,
    CancelButton,
    ModalComponent,
    Edit,
    Delete,
    VideoPause,
    VideoPlay,
    Plus,
    CaretRight
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
        id: null,
        name: "",
        description: "",
        data_source_ids: [],
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
        if (newSources.length > 0 && this.newSchedule.data_source_ids.length === 0) {
          this.newSchedule.data_source_ids = [newSources[0].id]
        }
      },
      immediate: true,
    },
    showNewScheduleModal(val) {
      if (!val) {
        this.resetNewScheduleForm()
      }
    }
  },
  created() {
    this.fetchAutoSchedules()
  },
  methods: {
    resetNewScheduleForm() {
      this.newSchedule = {
        id: null,
        name: "",
        description: "",
        data_source_ids: this.availableSources.length > 0 ? [this.availableSources[0].id] : [],
        interval: "weekly",
        keywords: "",
        max_results: 100,
        is_active: true,
      }
    },

    async saveSchedule() {
      if (!this.newSchedule.name.trim()) {
        ElMessage.error("请输入任务名称")
        return
      }

      if (!this.newSchedule.data_source_ids.length) {
        ElMessage.error("请选择至少一个数据源")
        return
      }

      if (!this.newSchedule.keywords.trim()) {
        ElMessage.error("请输入关键词")
        return
      }

      const scheduleData = {
        name: this.newSchedule.name.trim(),
        description: this.newSchedule.description.trim(),
        data_source_ids: this.newSchedule.data_source_ids,
        interval: this.newSchedule.interval,
        is_active: this.newSchedule.is_active,
        query_params: {
          keywords: this.newSchedule.keywords.trim(),
          max_results: this.newSchedule.max_results,
        },
      }

      try {
        if (this.newSchedule.id) {
          await Crawler.updateSchedule(this.newSchedule.id, scheduleData)
          ElMessage.success("任务更新成功")
        } else {
          await Crawler.createSchedule(scheduleData)
          ElMessage.success("任务创建成功")
        }
        this.showNewScheduleModal = false
        this.fetchAutoSchedules()
      } catch (error) {
        ElMessage.error(this.newSchedule.id ? "更新任务失败" : "创建任务失败")
        console.error("Error saving schedule:", error)
      }
    },

    async fetchAutoSchedules() {
      try {
        const response = await Crawler.getScheduleList()
        this.autoSchedules = response.data.data || []
      } catch (error) {
        ElMessage.error("获取自动爬取任务失败")
        console.error("Error fetching schedules:", error)
      }
    },

    editSchedule(schedule) {
      this.newSchedule = {
        id: schedule.id,
        name: schedule.name || "",
        description: schedule.description || "",
        data_source_ids: schedule.data_sources && schedule.data_sources.length > 0
          ? this.getDataSourceIdsByNames(schedule.data_sources)
          : schedule.data_source_ids || [],
        interval: schedule.interval,
        keywords: schedule.query_params?.keywords || "",
        max_results: schedule.query_params?.max_results || 100,
        is_active: schedule.is_active,
      }
      this.showNewScheduleModal = true
    },

    async toggleSchedule(schedule) {
      const action = schedule.is_active ? "暂停" : "启用"
      try {
        const response = await Crawler.toggleSchedule(schedule.id, !schedule.is_active)
        if (response.status === 200) {
          ElMessage.success(`任务已${action}成功`)
          this.fetchAutoSchedules()
        } else {
          ElMessage.error(`任务${action}失败`)
        }
      } catch (error) {
        ElMessage.error(`更新任务状态失败`)
        console.error("Error toggling schedule:", error)
      }
    },
    async triggerScheduleNow(schedule) {
      try {
        const response = await Crawler.triggerSchedule(schedule.id)
        console.log(response)  // 查看响应内容
        console.log(response.status)  // 查看状态码
        const message = response.data.message
        if (response.status === 202) {
          ElMessage.success(`任务"${schedule.name}"已开始执行`)
          this.fetchAutoSchedules() // Refresh the list to show the new status
        } else {
          ElMessage.error(message)
        }
      } catch (error) {
        if (error.response) {
          const message = error.response.data.message || "触发任务失败"
          ElMessage.error(`触发任务失败: ${message}`)
        } else {
          ElMessage.error(`触发任务失败: ${error.message}`)
        }
      }
    },
    async deleteSchedule(schedule) {
      ElMessageBox.confirm(
        `确定要删除任务"${schedule.name}"吗？`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            const response = await Crawler.deleteSchedule(schedule.id)
            if (response.data.success) {
              ElMessage.success("任务删除成功")
              this.fetchAutoSchedules()
            } else {
              ElMessage.error("任务删除失败")
            }
          } catch (error) {
            ElMessage.error("删除任务失败")
            console.error("Error deleting schedule:", error)
          }
        })
        .catch(() => {
          // ElMessage.info("已取消删除")
        })
    },

    getDataSourceIdsByNames(sourceNames) {
      if (!sourceNames || !Array.isArray(sourceNames)) {
        return []
      }
      return sourceNames.map(name => {
        const source = this.availableSources.find(s => s.name === name)
        return source ? source.id : null
      }).filter(id => id !== null)
    },

    formatDataSources(dataSources) {
      if (!dataSources || !Array.isArray(dataSources)) {
        return "未知数据源"
      }
      return dataSources.join(", ")
    },

    formatFrequency(frequency) {
      switch (frequency) {
        case "hourly":
          return "每小时"
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

    formatDateTime(dateTimeString) {
      if (!dateTimeString) return "无"

      try {
        const date = new Date(dateTimeString)
        const now = new Date()
        const diffMs = date.getTime() - now.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        // 格式化为本地时间
        const formatted = date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })

        // 添加相对时间提示
        if (Math.abs(diffMs) < 1000 * 60 * 60 * 24) { // 24小时内
          if (diffMs > 0) {
            if (diffHours < 1) {
              return `${formatted} (即将执行)`
            } else {
              return `${formatted} (${diffHours}小时后)`
            }
          } else {
            const pastHours = Math.abs(diffHours)
            if (pastHours < 1) {
              return `${formatted} (刚刚)`
            } else if (pastHours < 24) {
              return `${formatted} (${pastHours}小时前)`
            }
          }
        } else if (diffMs > 0 && diffDays <= 7) {
          return `${formatted} (${diffDays}天后)`
        }

        return formatted
      } catch (error) {
        console.error("Error formatting date:", error)
        return dateTimeString
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
  align-items: flex-start;
  transition: all 0.3s;
  background: #fff;
}

.schedule-item:hover {
  border-color: #a8e6cf;
  background-color: rgba(168, 230, 207, 0.02);
  box-shadow: 0 2px 8px rgba(168, 230, 207, 0.1);
}

.schedule-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.schedule-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.schedule-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
  color: #666;
  font-size: 13px;
}

.schedule-details>div {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #555;
  margin-right: 0.25rem;
  min-width: 45px;
}

.schedule-stats {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(248, 249, 250, 0.6);
  border-radius: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.stat-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 0.125rem;
}

.stat-value {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.stat-item.success .stat-value {
  color: #28a745;
}

.stat-item.failed .stat-value {
  color: #dc3545;
}

.schedule-time-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(26, 145, 193, 0.02);
  border-radius: 6px;
  border-left: 2px solid #1a91c1;
}

.time-item {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.time-label {
  color: #666;
  font-size: 10px;
  margin-bottom: 1px;
}

.time-value {
  color: #333;
  font-weight: 500;
}

.schedule-status {
  font-size: 12px;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  display: inline-block;
  font-weight: 500;
}

.schedule-status.active {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.schedule-status.inactive {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.2);
}

.schedule-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-left: 0.75rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 30px;
  height: 30px;
}

.action-btn:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
}

.edit-btn:hover {
  color: #1a91c1;
  background-color: rgba(26, 145, 193, 0.1);
}

.pause-btn:hover {
  color: #ffc107;
  background-color: rgba(255, 193, 7, 0.1);
}

.play-btn:hover {
  color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
}

.delete-btn:hover {
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}

.empty-schedules {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-style: italic;
  background: rgba(248, 249, 250, 0.5);
  border-radius: 12px;
  border: 2px dashed #e9ecef;
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
  padding: 1rem;
  border: 2px dashed #ddd;
  border-radius: 12px;
  background: none;
  color: #1a91c1;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover {
  border-color: #a8e6cf;
  background-color: rgba(168, 230, 207, 0.05);
  transform: translateY(-2px);
}

/* 表单样式 */
.schedule-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 1.5rem;
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
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.15);
}

/* 多选框样式 */
.multi-select-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  background-color: #fff;
  transition: all 0.3s;
}

.multi-select-container:focus-within {
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.15);
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: all 0.2s;
}

.checkbox-item:hover {
  background-color: rgba(168, 230, 207, 0.05);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
}

.checkbox-input {
  margin-right: 0.75rem;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-label {
  font-size: 14px;
  color: #333;
  user-select: none;
}

.form-input[required]:invalid {
  border-color: #dc3545;
}

.form-input[required]:invalid:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .schedule-item {
    flex-direction: column;
    align-items: stretch;
  }

  .schedule-actions {
    flex-direction: row;
    justify-content: flex-end;
    margin-left: 0;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #eee;
  }

  .trigger-btn:hover {
    color: #1abc9c;
    background-color: rgba(26, 188, 156, 0.1);
  }

  .schedule-details {
    grid-template-columns: 1fr;
  }

  .schedule-stats {
    justify-content: space-around;
  }

  .schedule-time-info {
    grid-template-columns: 1fr;
  }

  .checkbox-group {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .schedule-item {
    padding: 0.75rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .checkbox-group {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>