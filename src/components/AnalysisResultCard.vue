<!-- src/components/AnalysisResultCard.vue -->
<template>
  <div class="analysis-result-card" v-if="visible" @click.self="handleOverlayClick">
    <div class="card-overlay" @click.self="handleOverlayClick">
      <div class="card-content" @click.stop>
        <div class="card-header">
          <h3>分析任务详情</h3>
          <button class="close-btn" @click="handleCloseCard">
            <el-icon>
              <Close />
            </el-icon>
          </button>
        </div>

        <div class="card-body">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-container">
            <el-card v-loading="isLoading" class="loading-container">
              <p class="loading-text">正在加载任务详情...</p>
            </el-card>
          </div>

          <!-- 任务信息 -->
          <div v-else-if="taskData" class="task-info">
            <div class="info-row">
              <span class="label">任务ID:</span>
              <span class="value">{{ taskData.id }}</span>
            </div>
            <div class="info-row">
              <span class="label">状态:</span>
              <span class="value" :class="getStatusClass(taskData.status)">
                {{ getStatusText(taskData.status) }}
              </span>
            </div>
            <div class="info-row" v-if="taskData.literature">
              <span class="label">文献:</span>
              <span class="value">{{ taskData.literature.title || '未命名文献' }}</span>
            </div>
            <div class="info-row" v-if="taskData.start_time">
              <span class="label">开始时间:</span>
              <span class="value">{{ formatDateTime(taskData.start_time) }}</span>
            </div>
            <div class="info-row" v-if="taskData.end_time">
              <span class="label">结束时间:</span>
              <span class="value">{{ formatDateTime(taskData.end_time) }}</span>
            </div>
            <div class="info-row" v-if="taskData.error_message">
              <span class="label">错误信息:</span>
              <span class="value error-text">{{ taskData.error_message }}</span>
            </div>
          </div>

          <!-- 分析结果 -->
          <div class="analysis-results" v-if="taskData && taskData.status === 'completed'">
            <div class="result-section">
              <h4>实体关系分析结果</h4>

              <!-- 统计信息 -->
              <div class="stats-row" v-if="analysisStats">
                <div class="stat-item">
                  <span class="stat-number">{{ analysisStats.entityCount }}</span>
                  <span class="stat-label">实体数量</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ analysisStats.relationshipCount }}</span>
                  <span class="stat-label">关系数量</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ analysisStats.entityRelationCount }}</span>
                  <span class="stat-label">实体关联数量</span>
                </div>
              </div>

              <!-- 图谱可视化 - 使用自定义图谱组件或直接渲染 -->
              <div class="graph-container" v-if="graphData.nodes && graphData.nodes.length > 0">
                <!-- 方案1: 如果 GraphVisualization 支持传入自定义数据，确保不调用全局API -->
                <GraphVisualization :graph-data="graphData" :graph-settings="graphSettings" :is-loading=false
                  :current-view="'entity'" :use-custom-data="true" :disable-api-fetch="true" />

                <!-- 方案2: 如果上面的props不支持，可以用简单的图谱展示 -->
                <!-- <div class="simple-graph-display">
                  <div class="graph-nodes">
                    <h6>节点 ({{ graphData.nodes.length }})</h6>
                    <div class="node-list">
                      <div v-for="node in graphData.nodes.slice(0, 10)" :key="node.id" class="node-item">
                        <span class="node-label">{{ node.label }}</span>
                        <span class="node-type">{{ node.type }}</span>
                      </div>
                      <div v-if="graphData.nodes.length > 10" class="more-nodes">
                        +{{ graphData.nodes.length - 10 }} 更多节点...
                      </div>
                    </div>
                  </div>
                  <div class="graph-edges">
                    <h6>关系 ({{ graphData.edges.length }})</h6>
                    <div class="edge-list">
                      <div v-for="edge in graphData.edges.slice(0, 10)" :key="edge.id" class="edge-item">
                        <span class="edge-label">{{ edge.label }}</span>
                        <span class="edge-info">{{ getNodeNameById(edge.from) }} → {{ getNodeNameById(edge.to) }}</span>
                      </div>
                      <div v-if="graphData.edges.length > 10" class="more-edges">
                        +{{ graphData.edges.length - 10 }} 更多关系...
                      </div>
                    </div>
                  </div>
                </div> -->
              </div>

              <!-- 无数据提示 -->
              <div v-else class="no-data-placeholder">
                <el-icon class="no-data-icon">
                  <Document />
                </el-icon>
                <p>暂无分析结果数据</p>
              </div>
            </div>

            <!-- 实体列表 -->
            <div class="entity-list-section" v-if="entities && entities.length > 0">
              <h5>识别的实体 ({{ entities.length }})</h5>
              <div class="entity-tags">
                <el-tag v-for="entity in entities.slice(0, 20)" :key="entity.id" class="entity-tag"
                  :type="getEntityTagType(entity.entity_type)" size="small">
                  <el-icon class="entity-icon">
                    <component :is="getNodeIcon(entity.entity_type)" />
                  </el-icon>
                  {{ entity.name }}
                  <span class="entity-type">{{ entity.entity_type_display || getNodeLabel(entity.entity_type) }}</span>
                </el-tag>
                <el-tag v-if="entities.length > 20" type="info" size="small">
                  +{{ entities.length - 20 }} 更多...
                </el-tag>
              </div>
            </div>

            <!-- 关系列表 -->
            <div class="relationship-list-section" v-if="relationships && relationships.length > 0">
              <h5>识别的关系 ({{ relationships.length }})</h5>
              <div class="relationship-cards">
                <div v-for="relationship in relationships.slice(0, 10)" :key="relationship.id"
                  class="relationship-card">
                  <div class="relationship-content">
                    <span class="relationship-name">{{ relationship.name }}</span>
                    <span class="relationship-type">{{ relationship.relation_type_display ||
                      getRelationLabel(relationship.relation_type) }}</span>
                    <!-- 显示关联的实体 -->
                    <div class="relationship-entities"
                      v-if="relationship.source_entity_id && relationship.target_entity_id">
                      <span class="entity-connection">
                        {{ getEntityNameById(relationship.source_entity_id) }} → {{
                          getEntityNameById(relationship.target_entity_id) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="relationships.length > 10" class="more-relationships">
                  <el-tag type="info" size="small">
                    +{{ relationships.length - 10 }} 更多关系...
                  </el-tag>
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
          <primary-button @click="handleCloseCard" class="close-button">关闭</primary-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import PrimaryButton from '@/components/buttons/PrimaryButton.vue'
import GraphVisualization from '@/components/knowledge/GraphVisualization.vue'
import Literature from '@/api/Literature'
import { useNodeConfig } from '@/composables/useNodeConfig'
import { Close, Document, Loading, SuccessFilled, WarningFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'AnalysisResultCard',
  components: {
    PrimaryButton,
    GraphVisualization,
    Close,
    Document,
    Loading,
    SuccessFilled,
    WarningFilled,
    CircleCloseFilled
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    taskId: {
      type: [Number, String],
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { getNodeColor, getNodeLabel, getNodeIcon, getRelationLabel } = useNodeConfig()

    // 响应式数据
    const taskData = ref(null)
    const isLoading = ref(false)
    const isGraphLoading = ref(false)
    const entities = ref([])
    const relationships = ref([])
    const entityRelations = ref([])
    const graphData = ref({
      nodes: [],
      edges: []
    })

    const graphSettings = ref({
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 1
        },
        stabilization: { iterations: 150 }
      },
      layout: {
        improvedLayout: true
      },
      nodes: {
        borderWidth: 2,
        shadow: true,
        font: { color: '#333333' }
      },
      edges: {
        arrows: 'to',
        smooth: true,
        shadow: true,
        font: { color: '#333333', size: 12 }
      }
    })

    // 计算属性
    const analysisStats = computed(() => {
      if (!taskData.value || taskData.value.status !== 'completed') {
        return null
      }
      return {
        entityCount: entities.value.length,
        relationshipCount: relationships.value.length,
        entityRelationCount: entityRelations.value.length
      }
    })
    const loadTaskDetail = async () => {
      if (!props.taskId) return

      console.log('Loading task detail for:', props.taskId) // 调试日志
      isLoading.value = true

      try {
        const response = await Literature.getAnalyzeDetail(props.taskId)
        console.log('Task detail response:', response) // 调试日志

        if (response.data && response.data.data) {
          taskData.value = response.data.data

          // 确保使用任务特定的数据，而不是全局数据
          entities.value = taskData.value.entities || []
          relationships.value = taskData.value.relationships || []
          entityRelations.value = taskData.value.entity_relations || []

          console.log('Loaded entities:', entities.value.length) // 调试日志
          console.log('Loaded relationships:', relationships.value.length) // 调试日志

          if (taskData.value.status === 'completed') {
            isGraphLoading.value = true
            try {
              await nextTick() // 等待DOM更新
              buildGraphData()
            } catch (error) {
              console.error("Error loading analysis results:", error)
              ElMessage.error('加载分析结果失败')
            } finally {
              isGraphLoading.value = false
            }
          }
        }
      } catch (error) {
        console.error("Error loading task detail:", error)
        ElMessage.error('加载任务详情失败')
      } finally {
        isLoading.value = false
      }
    }
    const resetData = () => {
      taskData.value = null
      entities.value = []
      relationships.value = []
      entityRelations.value = []
      graphData.value = { nodes: [], edges: [] }
      isLoading.value = false
      isGraphLoading.value = false
    }
    // 监听器
    watch(() => props.visible, (newVal) => {
      if (newVal && props.taskId) {
        loadTaskDetail()
      } else if (!newVal) {
        // 清理数据
        resetData()
      }
    }, { immediate: true })

    watch(() => props.taskId, (newVal) => {
      if (newVal && props.visible) {
        loadTaskDetail()
      }
    }, { immediate: true })

    // 方法
    const handleCloseCard = () => {
      console.log('handleCloseCard called') // 调试日志
      emit('close')
    }

    const handleOverlayClick = () => {
      console.log('handleOverlayClick called') // 调试日志
      emit('close')
    }





    const buildGraphData = () => {
      console.log('Building graph data...') // 调试日志

      // 构建节点数据 - 只使用当前任务的实体
      const nodes = entities.value.map(entity => ({
        id: entity.id,
        label: entity.name,
        type: entity.entity_type || 'default',
        title: `实体: ${entity.name}\n类型: ${entity.entity_type_display || entity.entity_type || '未知'}`,
        color: getNodeColor(entity.entity_type),
        size: 20,
        font: { size: 12 }
      }))

      // 构建边数据 - 只使用当前任务的关系
      const edges = relationships.value.filter(relation => {
        // 确保关系的两端实体都在当前任务的实体列表中
        const hasSourceEntity = entities.value.some(e => e.id === relation.source_entity_id)
        const hasTargetEntity = entities.value.some(e => e.id === relation.target_entity_id)
        return hasSourceEntity && hasTargetEntity
      }).map((relation, index) => ({
        id: relation.id || `rel_${index}`,
        from: relation.source_entity_id || relation.from,
        to: relation.target_entity_id || relation.to,
        label: relation.relation_type_display || getRelationLabel(relation.relation_type) || '关联',
        title: `关系: ${relation.name || ''}\n类型: ${relation.relation_type_display || relation.relation_type || '关联'}`,
        color: { color: '#999999' },
        width: 2
      }))

      graphData.value = { nodes, edges }
      console.log('父组件中Graph data built:', { nodes: nodes.length, edges: edges.length }) // 调试日志
    }

    // 根据实体ID获取实体名称
    const getEntityNameById = (entityId) => {
      const entity = entities.value.find(e => e.id === entityId)
      return entity ? entity.name : `实体${entityId}`
    }

    // 根据节点ID获取节点名称（用于图谱显示）
    const getNodeNameById = (nodeId) => {
      const node = graphData.value.nodes.find(n => n.id === nodeId)
      return node ? node.label : `节点${nodeId}`
    }

    const getEntityTagType = (entityType) => {
      const typeMap = {
        'pathogen': 'danger',
        'infection_site': 'success',
        'clinical_symptom': 'primary',
        'diagnosis_method': 'warning',
        'treatment_plan': 'success',
        'prevention_strategy': 'info',
        'cirrhosis_stage': 'warning',
        'complication': 'danger',
        'default': 'info'
      }
      return typeMap[entityType] || typeMap.default
    }

    const getStatusText = (status) => {
      const statusMap = {
        'pending': '等待中',
        'running': '分析中',
        'completed': '已完成',
        'failed': '失败'
      }
      return statusMap[status] || status
    }

    const getStatusClass = (status) => {
      return `status-${status}`
    }

    const getStatusIcon = (status) => {
      const iconMap = {
        'pending': 'Loading',
        'running': 'Loading',
        'completed': 'SuccessFilled',
        'failed': 'CircleCloseFilled'
      }
      return iconMap[status] || 'Loading'
    }

    const getStatusDescription = (status) => {
      const descMap = {
        'pending': '任务正在等待执行中，请稍候...',
        'running': '任务正在分析中，请耐心等待...',
        'failed': '任务执行失败，请检查错误信息或重新提交'
      }
      return descMap[status] || ''
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      return new Date(dateTime).toLocaleString('zh-CN')
    }

    return {
      // 数据
      taskData,
      isLoading,
      isGraphLoading,
      entities,
      relationships,
      entityRelations,
      graphData,
      graphSettings,

      // 计算属性
      analysisStats,

      // 方法
      handleCloseCard,
      handleOverlayClick,
      resetData,
      loadTaskDetail,
      buildGraphData,
      getEntityNameById,
      getNodeNameById,
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
.status-pending {
  color: #f59e0b;
}

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

/* 图谱容器 */
.graph-container {
  height: 400px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

/* 简单图谱展示样式 */
.simple-graph-display {
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.graph-nodes,
.graph-edges {
  margin-bottom: 20px;
}

.graph-nodes h6,
.graph-edges h6 {
  margin: 0 0 10px 0;
  font-weight: 600;
  color: #374151;
}

.node-list,
.edge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item,
.edge-item {
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-label,
.edge-label {
  font-weight: 500;
  color: #374151;
}

.node-type,
.edge-info {
  font-size: 12px;
  color: #6b7280;
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
.entity-list-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.entity-list-section h5 {
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
.relationship-list-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.relationship-list-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.relationship-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.relationship-card {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #fafafa;
}

.relationship-content {
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

.relationship-entities {
  margin-top: 4px;
}

.entity-connection {
  font-size: 10px;
  color: #6b7280;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.more-relationships {
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