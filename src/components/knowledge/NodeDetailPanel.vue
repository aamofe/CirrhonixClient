<!-- src/components/knowledge/NodeDetailPanel.vue -->
<template>
  <div class="node-detail-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-content">
        <div class="node-icon" :class="`icon-${node.type}`">
          <el-icon>
            <component :is="getNodeIcon(node.type)" />
          </el-icon>
        </div>
        <div class="node-info">
          <h3 class="node-name">{{ node.label || node.name }}</h3>
          <span class="node-type">{{ getNodeLabel(node.type) }}</span>
          <span v-if="node.subtype" class="node-subtype">{{ node.subtype }}</span>
        </div>
      </div>
      <el-button class="close-btn" @click="closePanel" link size="small" :icon="Close" title="关闭" />
    </div>

    <!-- 面板内容 -->
    <div class="panel-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <h4 class="section-title">
          <el-icon>
            <InfoFilled />
          </el-icon>
          基本信息
        </h4>
        <div class="info-grid">
          <div class="info-item" v-if="entityDetail?.description">
            <label>描述：</label>
            <span>{{ entityDetail.description }}</span>
          </div>
          <div class="info-item" v-if="entityDetail?.detection_rate">
            <label>检出率：</label>
            <span>{{ (entityDetail.detection_rate * 100).toFixed(1) }}%</span>
          </div>
          <div class="info-item" v-if="entityDetail?.severity_level">
            <label>严重程度：</label>
            <div class="severity-level">
              <div class="severity-bar">
                <div class="severity-fill" :style="{ width: entityDetail.severity_level * 20 + '%' }"
                  :class="getSeverityClass(entityDetail.severity_level)"></div>
              </div>
              <span>{{ entityDetail.severity_level }}/5</span>
            </div>
          </div>
          <div class="info-item" v-if="
            entityDetail?.properties &&
            Object.keys(entityDetail.properties).length > 0
          ">
            <label>属性：</label>
            <div class="properties">
              <div v-for="(value, key) in entityDetail.properties" :key="key" class="property-item">
                <span class="property-key">{{ key }}:</span>
                <span class="property-value">{{ value }}</span>
              </div>
            </div>
          </div>
          <div class="info-item">
            <label>创建时间：</label>
            <span>{{ formatDate(entityDetail?.created_at) }}</span>
          </div>
          <div class="info-item">
            <label>更新时间：</label>
            <span>{{ formatDate(entityDetail?.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 关系统计 -->
      <div class="info-section" v-if="entityDetail?.relation_summary">
        <h4 class="section-title">
          <el-icon>
            <DataAnalysis />
          </el-icon>
          关系统计
        </h4>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">
              {{ entityDetail.relation_summary.total_relations }}
            </div>
            <div class="stat-label">总关系数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ entityDetail.relation_summary.as_source_count }}
            </div>
            <div class="stat-label">作为源实体</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ entityDetail.relation_summary.as_target_count }}
            </div>
            <div class="stat-label">作为目标实体</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ entityDetail.relation_summary.unique_related_entities }}
            </div>
            <div class="stat-label">关联实体数</div>
          </div>
        </div>
      </div>

      <!-- 关系列表 -->
      <div class="info-section" v-if="entityDetail?.relations">
        <h4 class="section-title">
          <el-icon>
            <Share />
          </el-icon>
          关系详情
          <span class="section-count">({{ getTotalRelations() }})</span>
        </h4>

        <!-- 关系类型标签 -->
        <div class="relation-tabs">
          <el-button v-for="tab in relationTabs" :key="tab.key" :type="activeRelationTab === tab.key ? 'primary' : ''"
            :plain="activeRelationTab !== tab.key" size="small" @click="activeRelationTab = tab.key">
            {{ tab.label }} ({{ tab.count }})
          </el-button>
        </div>

        <!-- 关系内容 -->
        <div class="relations-content">
          <div v-if="getCurrentRelations().length === 0" class="no-relations">
            暂无{{ getActiveTabLabel() }}关系
          </div>
          <div v-else class="relations-list">
            <div v-for="relation in getCurrentRelations()" :key="relation.id" class="relation-item"
              :class="{ verified: relation.is_verified }">
              <div class="relation-header">
                <div class="relation-path">
                  <span class="entity-name" @click="focusEntity(getRelationSourceEntity(relation))">
                    {{ getRelationSourceEntity(relation).name }}
                  </span>
                  <el-icon>
                    <Right />
                  </el-icon>
                  <span class="relation-type">{{
                    relation.relationship?.name
                  }}</span>
                  <el-icon>
                    <Right />
                  </el-icon>
                  <span class="entity-name" @click="focusEntity(getRelationTargetEntity(relation))">
                    {{ getRelationTargetEntity(relation).name }}
                  </span>
                </div>
                <div class="relation-badges">
                  <el-tag v-if="relation.is_verified" type="success" size="small">已验证</el-tag>
                  <el-tag :type="getSupportDegreeTagType(relation.support_degree)" size="small">
                    支持度: {{ (relation.support_degree * 100).toFixed(0) }}%
                  </el-tag>
                </div>
              </div>

              <div class="relation-details" v-if="relation.relationship?.description">
                <p class="relation-description">
                  {{ relation.relationship.description }}
                </p>
              </div>

              <div v-if="relation.supporting_literature" class="relation-literature">
                <span class="literature-label">支持文献：</span>
                <el-link type="primary" @click="viewArticle(relation.supporting_literature.id)">
                  {{ relation.supporting_literature.title }}
                </el-link>
              </div>

              <div v-if="relation.verification_notes" class="verification-notes">
                <span class="notes-label">验证备注：</span>
                <span>{{ relation.verification_notes }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关实体 -->
      <div class="info-section" v-if="entityDetail?.related_entities?.length > 0">
        <h4 class="section-title">
          <el-icon>
            <Connection />
          </el-icon>
          相关实体
          <span class="section-count">({{ entityDetail.related_entities.length }})</span>
        </h4>
        <div class="related-entities">
          <div v-for="entity in entityDetail.related_entities" :key="entity.id" class="related-entity-item"
            @click="focusEntity(entity)">
            <div class="entity-icon" :class="`icon-${entity.entity_type}`">
              <el-icon>
                <component :is="getNodeIcon(entity.entity_type)" />
              </el-icon>
            </div>
            <div class="entity-info">
              <div class="entity-name">{{ entity.name }}</div>
              <div class="entity-type">
                {{ getNodeLabel(entity.entity_type) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>加载中...</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Close,
  InfoFilled,
  DataAnalysis,
  Share,
  Right,
  Connection,
  Loading,
  BugFilled,
  Aim,
  Stethoscope,
  Search,
  Pills,
  Shield,
  CopyDocument,
  WarnTriangleFilled
} from '@element-plus/icons-vue'
import { useNodeConfig } from '@/composables/useNodeConfig'
import KnowledgeGraph from '@/api/knowledgeGraph'

export default {
  name: 'NodeDetailPanel',
  components: {
    Close,
    InfoFilled,
    DataAnalysis,
    Share,
    Right,
    Connection,
    Loading,
    BugFilled,
    Aim,
    Stethoscope,
    Search,
    Pills,
    Shield,
    CopyDocument,
    WarnTriangleFilled
  },
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
  emits: ['close', 'view-article', 'focus-node'],
  setup(props, { emit }) {
    const { getNodeLabel, getNodeIcon } = useNodeConfig()

    // 响应式数据
    const isLoading = ref(false)
    const entityDetail = ref(null)
    const activeRelationTab = ref('all')

    // 计算属性：关系标签页
    const relationTabs = computed(() => {
      if (!entityDetail.value?.relations) return []

      const tabs = [
        {
          key: 'all',
          label: '全部',
          count: getTotalRelations(),
        },
      ]

      if (entityDetail.value.relations.as_source?.length > 0) {
        tabs.push({
          key: 'as_source',
          label: '作为源实体',
          count: entityDetail.value.relations.as_source.length,
        })
      }

      if (entityDetail.value.relations.as_target?.length > 0) {
        tabs.push({
          key: 'as_target',
          label: '作为目标实体',
          count: entityDetail.value.relations.as_target.length,
        })
      }

      return tabs
    })

    // 方法定义
    const loadEntityDetail = async () => {
      if (!props.node?.id) return

      try {
        isLoading.value = true
        const response = await KnowledgeGraph.getEntityDetail(props.node.id)

        if (response.data.data) {
          entityDetail.value = response.data.data
        }
      } catch (error) {
        console.error('加载实体详情失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const getSeverityClass = (level) => {
      if (level <= 1) return 'severity-low'
      if (level <= 3) return 'severity-medium'
      return 'severity-high'
    }

    const getSupportDegreeClass = (degree) => {
      const percentage = degree * 100
      if (percentage >= 80) return 'high'
      if (percentage >= 50) return 'medium'
      return 'low'
    }

    const getSupportDegreeTagType = (degree) => {
      const percentage = degree * 100
      if (percentage >= 80) return 'success'
      if (percentage >= 50) return 'warning'
      return 'danger'
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('zh-CN')
    }

    const getTotalRelations = () => {
      if (!entityDetail.value?.relations) return 0
      const asSource = entityDetail.value.relations.as_source?.length || 0
      const asTarget = entityDetail.value.relations.as_target?.length || 0
      return asSource + asTarget
    }

    const getCurrentRelations = () => {
      if (!entityDetail.value?.relations) return []

      switch (activeRelationTab.value) {
        case 'as_source':
          return entityDetail.value.relations.as_source || []
        case 'as_target':
          return entityDetail.value.relations.as_target || []
        case 'all':
        default:
          return [
            ...(entityDetail.value.relations.as_source || []),
            ...(entityDetail.value.relations.as_target || []),
          ]
      }
    }

    const getActiveTabLabel = () => {
      const tab = relationTabs.value.find(
        (t) => t.key === activeRelationTab.value
      )
      return tab ? tab.label : '全部'
    }

    const getRelationSourceEntity = (relation) => {
      return (
        relation.source_entity || {
          id: relation.source_entity_id,
          name: '未知实体',
          entity_type: 'unknown',
        }
      )
    }

    const getRelationTargetEntity = (relation) => {
      return (
        relation.target_entity || {
          id: relation.target_entity_id,
          name: '未知实体',
          entity_type: 'unknown',
        }
      )
    }

    const focusEntity = (entity) => {
      if (entity?.id) {
        emit('focus-node', entity.id)
      }
    }

    const closePanel = () => {
      emit('close')
    }

    const viewArticle = (articleId) => {
      emit('view-article', articleId)
    }

    // 监听器
    watch(
      () => props.node,
      (newNode) => {
        if (newNode) {
          activeRelationTab.value = 'all'
          loadEntityDetail()
        }
      },
      { immediate: true }
    )

    // 生命周期
    onMounted(() => {
      if (props.node) {
        loadEntityDetail()
      }
    })

    return {
      // Element Plus 图标
      Close,
      InfoFilled,
      DataAnalysis,
      Share,
      Right,
      Connection,
      Loading,
      BugFilled,
      Aim,
      Stethoscope,
      Search,
      Pills,
      Shield,
      CopyDocument,
      WarnTriangleFilled,

      // 响应式数据
      isLoading,
      entityDetail,
      activeRelationTab,
      relationTabs,

      // 方法
      getNodeLabel,
      getNodeIcon,
      getSeverityClass,
      getSupportDegreeClass,
      getSupportDegreeTagType,
      formatDate,
      getTotalRelations,
      getCurrentRelations,
      getActiveTabLabel,
      getRelationSourceEntity,
      getRelationTargetEntity,
      focusEntity,
      closePanel,
      viewArticle,
    }
  },
}
</script>

<style scoped>
.node-detail-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: calc(100vh - 100px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.node-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.node-type,
.node-subtype {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  margin-right: 8px;
}

.close-btn {
  color: white !important;
  border: none !important;
  background: rgba(255, 255, 255, 0.2) !important;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

.panel-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 20px;
}

.info-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-count {
  color: #999;
  font-weight: normal;
  font-size: 14px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.severity-level {
  display: flex;
  align-items: center;
  gap: 12px;
}

.severity-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.severity-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.severity-low {
  background: #52c41a;
}

.severity-medium {
  background: #faad14;
}

.severity-high {
  background: #ff4d4f;
}

.properties {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-item {
  display: flex;
  gap: 8px;
}

.property-key {
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1890ff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.relation-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.relations-content {
  min-height: 100px;
}

.no-relations {
  text-align: center;
  color: #999;
  padding: 32px;
  font-style: italic;
}

.relations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.relation-item {
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
}

.relation-item.verified {
  border-color: #52c41a;
  background: #f6ffed;
}

.relation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.relation-path {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  margin-right: 16px;
}

.entity-name {
  cursor: pointer;
  color: #1890ff;
  font-weight: 600;
  text-decoration: underline;
}

.entity-name:hover {
  color: #40a9ff;
}

.relation-type {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.relation-badges {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.relation-description {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.relation-literature {
  margin-top: 8px;
  font-size: 14px;
}

.literature-label {
  color: #666;
  margin-right: 8px;
}

.verification-notes {
  margin-top: 8px;
  font-size: 14px;
}

.notes-label {
  color: #666;
  margin-right: 8px;
}

.related-entities {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-entity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.related-entity-item:hover {
  background: #e6f7ff;
  transform: translateY(-1px);
}

.entity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.entity-info {
  flex: 1;
}

.entity-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.entity-type {
  font-size: 12px;
  color: #666;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #1890ff;
}

.loading-spinner .el-icon {
  font-size: 24px;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>