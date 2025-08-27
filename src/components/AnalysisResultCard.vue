<!-- src/components/AnalysisResultCard.vue -->
<template>
  <div class="analysis-result-card" v-if="visible" @click.self="handleClose">
    <div class="card-overlay" @click.self="handleClose">
      <div class="card-content" @click.stop>
        <div class="card-header">
          <h3>分析任务详情</h3>
          <button class="close-btn" @click="handleClose">
            <el-icon>
              <Close />
            </el-icon>
          </button>
        </div>

        <div class="card-body">
          <!-- 加载状态 -->
          <el-card v-if="isLoading" v-loading="isLoading" class="loading-container">
            <p class="loading-text">正在加载任务详情...</p>
          </el-card>

          <!-- 任务信息 -->
          <div v-else-if="taskData" class="task-info">
            <div class="info-row" v-for="info in taskInfoList" :key="info.label">
              <span class="label">{{ info.label }}:</span>
              <span class="value" :class="info.class">{{ info.value }}</span>
            </div>
          </div>

          <!-- 分析结果 -->
          <div class="analysis-results" v-if="taskData?.status === 'completed'">
            <div class="result-section">
              <h4>实体关系分析结果</h4>

              <!-- 统计信息 -->
              <div class="stats-row" v-if="taskData.statistics">
                <div class="stat-item" v-for="stat in statisticsList" :key="stat.label">
                  <span class="stat-number">{{ stat.value }}</span>
                  <span class="stat-label">{{ stat.label }}</span>
                </div>
              </div>

              <div v-else class="no-data-placeholder">
                <el-icon class="no-data-icon">
                  <Document />
                </el-icon>
                <p>暂无分析结果数据</p>
              </div>
            </div>

            <!-- 实体列表 -->
            <div class="entity-list-section" v-if="taskData.entities?.length">
              <h5>识别的实体 ({{ taskData.entities.length }})</h5>
              <div class="entity-tags">
                <el-tag v-for="entity in taskData.entities.slice(0, 20)" :key="entity.id" class="entity-tag"
                  :type="getEntityTagType(entity.entity_type)" size="small">
                  <el-icon class="entity-icon">
                    <component :is="getNodeIcon(entity.entity_type)" />
                  </el-icon>
                  {{ entity.name }}
                  <span class="entity-type">{{ entity.entity_type_display || getNodeLabel(entity.entity_type) }}</span>
                </el-tag>
                <el-tag v-if="taskData.entities.length > 20" type="info" size="small">
                  +{{ taskData.entities.length - 20 }} 更多...
                </el-tag>
              </div>
            </div>

            <!-- 关系列表 -->
            <div class="relationship-list-section" v-if="taskData.relationships?.length">
              <h5>识别的关系 ({{ taskData.relationships.length }})</h5>
              <div class="relationship-cards">
                <div v-for="relationship in taskData.relationships.slice(0, 10)" :key="relationship.id"
                  class="relationship-card">
                  <div class="relationship-content">
                    <span class="relationship-name">{{ relationship.name }}</span>
                    <span class="relationship-type">{{ relationship.relation_type_display ||
                      getRelationLabel(relationship.relation_type) }}</span>
                  </div>
                </div>
                <div v-if="taskData.relationships.length > 10" class="more-relationships">
                  <el-tag type="info" size="small">+{{ taskData.relationships.length - 10 }} 更多关系...</el-tag>
                </div>
              </div>
            </div>

            <!-- 实体关系详情 -->
            <div class="entity-relations-section" v-if="taskData.entity_relations?.length">
              <h5>实体关系详情 ({{ taskData.entity_relations.length }})</h5>
              <div class="entity-relation-cards">
                <div v-for="relation in taskData.entity_relations.slice(0, 10)" :key="relation.id"
                  class="entity-relation-card">
                  <div class="relation-content">
                    <div class="relation-entities">
                      <span class="source-entity">{{ getEntityNameFromRelation(relation, 'source') }}</span>
                      <el-icon class="arrow-icon">
                        <ArrowRight />
                      </el-icon>
                      <span class="target-entity">{{ getEntityNameFromRelation(relation, 'target') }}</span>
                    </div>
                    <div class="relation-info">
                      <span class="relation-type">作用因子：{{ relation.factor?.factor_name || '未知关系' }}</span>
                      <!-- {{ relation }} -->
                      <span class="support-degree" v-if="relation.support_degree">(支持度: {{ relation.support_degree
                        }})</span>
                      <el-tag v-if="relation.is_verified" type="success" size="mini">已验证</el-tag>
                    </div>
                  </div>
                </div>
                <div v-if="taskData.entity_relations.length > 10" class="more-relations">
                  <el-tag type="info" size="small">+{{ taskData.entity_relations.length - 10 }} 更多关系...</el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 任务未完成状态 -->
          <div v-else-if="taskData && taskData.status !== 'completed'" class="status-info">
            <div class="status-icon-wrapper" :class="getStatusClass(taskData.status)">
              <el-icon class="status-icon">
                <component :is="getStatusIcon(taskData.status)" />
              </el-icon>
            </div>
            <p class="status-description">{{ getStatusDescription(taskData.status) }}</p>
          </div>
        </div>

        <div class="card-footer">
          <primary-button @click="handleClose" class="close-button">关闭</primary-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import PrimaryButton from '@/components/buttons/PrimaryButton.vue'
import Literature from '@/api/Literature'
import { useNodeConfig } from '@/composables/useNodeConfig'
import { Close, Document, Loading, Clock, SuccessFilled, WarningFilled, CircleCloseFilled, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'


const STATUS_CONFIG = {
  pending: { text: '等待中', icon: 'Loading', description: '任务正在等待执行中，请稍候...' },
  queued: { text: '已排队', icon: 'Clock', description: '任务已提交，等待处理器开始执行...' },
  running: { text: '分析中', icon: 'Loading', description: '任务正在分析中，请耐心等待...' },
  completed: { text: '已完成', icon: 'SuccessFilled', description: '' },
  failed: { text: '失败', icon: 'CircleCloseFilled', description: '任务执行失败，请检查错误信息或重新提交' }
}


const ENTITY_TAG_TYPES = {
  pathogen: 'danger',
  infection_site: 'success',
  clinical_symptom: 'primary',
  diagnosis_method: 'warning',
  treatment_plan: 'success',
  prevention_strategy: 'info',
  cirrhosis_stage: 'warning',
  complication: 'danger',
  default: 'info'
}

export default {
  name: 'AnalysisResultCard',
  components: {
    PrimaryButton,
    Close,
    Document,
    Loading,
    SuccessFilled,
    WarningFilled,
    CircleCloseFilled,
    ArrowRight
  },
  props: {
    visible: Boolean,
    taskId: [Number, String]
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { getNodeColor, getNodeLabel, getNodeIcon, getRelationLabel } = useNodeConfig()

    const taskData = ref(null)
    const isLoading = ref(false)


    const taskInfoList = computed(() => {
      if (!taskData.value) return []

      const info = [
        { label: '任务ID', value: taskData.value.id },
        { label: '状态', value: getStatusText(taskData.value.status), class: getStatusClass(taskData.value.status) }
      ]

      if (taskData.value.literature?.title) {
        info.push({ label: '文献', value: taskData.value.literature.title })
      }
      if (taskData.value.start_time) {
        info.push({ label: '开始时间', value: formatDateTime(taskData.value.start_time) })
      }
      if (taskData.value.end_time) {
        info.push({ label: '结束时间', value: formatDateTime(taskData.value.end_time) })
      }
      if (taskData.value.error_message) {
        info.push({ label: '错误信息', value: taskData.value.error_message, class: 'error-text' })
      }

      return info
    })

    const statisticsList = computed(() => {
      if (!taskData.value?.statistics) return []

      return [
        { label: '实体数量', value: taskData.value.statistics.total_entities },
        { label: '关系数量', value: taskData.value.statistics.total_relations },
        { label: '已验证关系', value: taskData.value.statistics.verified_relations }
      ]
    })


    const loadTaskDetail = async () => {
      if (!props.taskId) return

      isLoading.value = true
      try {
        const response = await Literature.getAnalyzeDetail(props.taskId)
        if (response.data?.data) {
          taskData.value = response.data.data
        }
      } catch (error) {

        ElMessage.error('加载任务详情失败')
      } finally {
        isLoading.value = false
      }
    }


    watch(() => [props.visible, props.taskId], ([visible, taskId]) => {
      if (visible && taskId) {
        loadTaskDetail()
      } else if (!visible) {
        taskData.value = null
        isLoading.value = false
      }
    }, { immediate: true })


    const handleClose = () => emit('close')

    const getEntityNameFromRelation = (relation, type) => {
      const entity = type === 'source' ? relation.source_entity : relation.target_entity
      if (entity?.name) return entity.name


      if (taskData.value?.entities) {
        const entityId = type === 'source' ? relation.source_entity_id : relation.target_entity_id
        const foundEntity = taskData.value.entities.find(e => e.id === entityId)
        if (foundEntity) return foundEntity.name
      }

      return type === 'source' ? '源实体' : '目标实体'
    }

    const getEntityTagType = (entityType) => ENTITY_TAG_TYPES[entityType] || ENTITY_TAG_TYPES.default
    const getStatusText = (status) => STATUS_CONFIG[status]?.text || status
    const getStatusClass = (status) => `status-${status}`
    const getStatusIcon = (status) => STATUS_CONFIG[status]?.icon || 'Loading'
    const getStatusDescription = (status) => STATUS_CONFIG[status]?.description || ''
    const formatDateTime = (dateTime) => dateTime ? new Date(dateTime).toLocaleString('zh-CN') : ''

    return {
      taskData,
      isLoading,
      taskInfoList,
      statisticsList,
      handleClose,
      getEntityNameFromRelation,
      getEntityTagType,
      getStatusText,
      getStatusClass,
      getStatusIcon,
      getStatusDescription,
      formatDateTime,
      getNodeIcon,
      getNodeLabel,
      getRelationLabel
    }
  }
}
</script>

<style scoped>
.analysis-result-card {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 1000px;
  max-height: 90vh;
  width: 90%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: #f3f4f6;
}

.card-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6b7280;
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
}

/* 任务信息 */
.task-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.label {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
  margin-right: 12px;
}

.value {
  color: #6b7280;
  flex: 1;
  word-break: break-all;
}

/* 状态样式 */
.status-pending,
.status-queued,
.status-running {
  color: #3b82f6;
}

.status-completed {
  color: #10b981;
}

.status-failed {
  color: #ef4444;
}

.error-text {
  color: #ef4444;
}

/* 分析结果 */
.analysis-results {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.result-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

/* 统计信息 */
.stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* 无数据提示 */
.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #9ca3af;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* 实体标签 */
.entity-list-section,
.relationship-list-section,
.entity-relations-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.entity-list-section h5,
.relationship-list-section h5,
.entity-relations-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.entity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.entity-tag {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.entity-icon {
  font-size: 12px;
}

.entity-type {
  font-size: 10px;
  opacity: 0.8;
  margin-left: 4px;
}

/* 关系列表 */
.relationship-cards,
.entity-relation-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.relationship-card,
.entity-relation-card {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #fafafa;
}

.relationship-content,
.relation-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.relationship-name {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.relationship-type {
  font-size: 11px;
  color: #6b7280;
}

.relation-entities {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.source-entity,
.target-entity {
  font-weight: 500;
  color: #374151;
}

.arrow-icon {
  color: #6b7280;
}

.relation-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.relation-type {
  font-weight: 500;
  color: #374151;
}

.support-degree {
  font-size: 11px;
  color: #6b7280;
}

.more-relationships,
.more-relations {
  grid-column: 1 / -1;
  text-align: center;
  padding: 8px;
}

/* 状态信息 */
.status-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.status-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.status-icon-wrapper.status-pending,
.status-icon-wrapper.status-queued,
.status-icon-wrapper.status-running {
  background-color: #dbeafe;
}

.status-icon-wrapper.status-failed {
  background-color: #fee2e2;
}

.status-icon {
  font-size: 32px;
}

.status-description {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.card-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.close-button {
  min-width: 80px;
}
</style>