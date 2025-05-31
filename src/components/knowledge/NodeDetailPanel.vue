<!-- src/components/knowledge/NodeDetailPanel.vue -->
<template>
  <div class="node-detail-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-content">
        <div class="node-icon" :class="`icon-${node.type}`">
          <i :class="getNodeIcon(node.type)"></i>
        </div>
        <div class="node-info">
          <h3 class="node-name">{{ node.label || node.name }}</h3>
          <span class="node-type">{{ getNodeLabel(node.type) }}</span>
          <span v-if="node.subtype" class="node-subtype">{{ node.subtype }}</span>
        </div>
      </div>
      <button class="close-btn" @click="closePanel" title="关闭">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- 面板内容 -->
    <div class="panel-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <h4 class="section-title">
          <i class="fas fa-info-circle"></i>
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
          <i class="fas fa-chart-bar"></i>
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
          <i class="fas fa-project-diagram"></i>
          关系详情
          <span class="section-count">({{ getTotalRelations() }})</span>
        </h4>

        <!-- 关系类型标签 -->
        <div class="relation-tabs">
          <button v-for="tab in relationTabs" :key="tab.key" class="tab-btn"
            :class="{ active: activeRelationTab === tab.key }" @click="activeRelationTab = tab.key">
            {{ tab.label }} ({{ tab.count }})
          </button>
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
                  <i class="fas fa-arrow-right"></i>
                  <span class="relation-type">{{
                    relation.relationship?.name
                  }}</span>
                  <i class="fas fa-arrow-right"></i>
                  <span class="entity-name" @click="focusEntity(getRelationTargetEntity(relation))">
                    {{ getRelationTargetEntity(relation).name }}
                  </span>
                </div>
                <div class="relation-badges">
                  <span v-if="relation.is_verified" class="badge verified">已验证</span>
                  <span class="badge support-degree" :class="getSupportDegreeClass(relation.support_degree)">
                    支持度: {{ (relation.support_degree * 100).toFixed(0) }}%
                  </span>
                </div>
              </div>

              <div class="relation-details" v-if="relation.relationship?.description">
                <p class="relation-description">
                  {{ relation.relationship.description }}
                </p>
              </div>

              <div v-if="relation.supporting_literature" class="relation-literature">
                <span class="literature-label">支持文献：</span>
                <a href="#" class="literature-link" @click.prevent="viewArticle(relation.supporting_literature.id)">
                  {{ relation.supporting_literature.title }}
                </a>
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
          <i class="fas fa-sitemap"></i>
          相关实体
          <span class="section-count">({{ entityDetail.related_entities.length }})</span>
        </h4>
        <div class="related-entities">
          <div v-for="entity in entityDetail.related_entities" :key="entity.id" class="related-entity-item"
            @click="focusEntity(entity)">
            <div class="entity-icon" :class="`icon-${entity.entity_type}`">
              <i :class="getNodeIcon(entity.entity_type)"></i>
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
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载中...</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useNodeConfig } from '@/composables/useNodeConfig'
import KnowledgeGraph from '@/api/knowledgeGraph'

export default {
  name: 'NodeDetailPanel',
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

        if (response.data) {
          entityDetail.value = response.data
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
  max-height: calc(100vh - 200px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1000;
  border: 1px solid #e1e8f0;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.node-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  font-size: 20px;
}

.node-info {
  flex: 1;
}

.node-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.node-type {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 12px;
  margin-right: 8px;
}

.node-subtype {
  font-size: 12px;
  opacity: 0.8;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 面板内容 */
.panel-content {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 0;
}

.info-section {
  padding: 20px;
  border-bottom: 1px solid #f0f4f8;
}

.info-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.section-count {
  color: #718096;
  font-weight: normal;
}

/* 基本信息 */
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
  font-weight: 500;
  color: #4a5568;
  font-size: 14px;
}

.info-item span {
  color: #2d3748;
  font-size: 14px;
}

.severity-level {
  display: flex;
  align-items: center;
  gap: 8px;
}

.severity-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.severity-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.severity-low {
  background: #48bb78;
}

.severity-medium {
  background: #ed8936;
}

.severity-high {
  background: #f56565;
}

.properties {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.property-key {
  font-weight: 500;
  color: #4a5568;
}

.property-value {
  color: #2d3748;
}

/* 统计信息 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2b6cb0;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #718096;
}

/* 关系标签页 */
.relation-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 关系列表 */
.relations-content {
  max-height: 300px;
  overflow-y: auto;
}

.no-relations {
  text-align: center;
  color: #a0aec0;
  padding: 40px 20px;
  font-size: 14px;
}

.relations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relation-item {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f7fafc;
  transition: all 0.2s;
}

.relation-item.verified {
  border-color: #48bb78;
  background: #f0fff4;
}

.relation-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  font-size: 14px;
}

.entity-name {
  font-weight: 500;
  color: #2b6cb0;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.entity-name:hover {
  background: rgba(43, 108, 176, 0.1);
}

.relation-type {
  font-weight: 600;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.relation-badges {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.badge.verified {
  background: #c6f6d5;
  color: #22543d;
}

.badge.support-degree {
  color: white;
}

.badge.support-degree.high {
  background: #48bb78;
}

.badge.support-degree.medium {
  background: #ed8936;
}

.badge.support-degree.low {
  background: #f56565;
}

.relation-description {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #4a5568;
  font-style: italic;
}

.relation-literature,
.verification-notes {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

.literature-label,
.notes-label {
  font-weight: 500;
}

.literature-link {
  color: #2b6cb0;
  text-decoration: none;
}

.literature-link:hover {
  text-decoration: underline;
}

/* 相关实体 */
.related-entities {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.related-entity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.related-entity-item:hover {
  border-color: #667eea;
  background: #f7fafc;
  transform: translateY(-1px);
}

.entity-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

.entity-icon.icon-pathogen {
  background: #f56565;
}

.entity-icon.icon-infection_site {
  background: #ed8936;
}

.entity-icon.icon-clinical_symptom {
  background: #48bb78;
}

.entity-icon.icon-diagnosis_method {
  background: #38b2ac;
}

.entity-icon.icon-treatment_plan {
  background: #667eea;
}

.entity-icon.icon-prevention_strategy {
  background: #9f7aea;
}

.entity-icon.icon-cirrhosis_stage {
  background: #ed64a6;
}

.entity-icon.icon-complication {
  background: #f6ad55;
}

.entity-info {
  flex: 1;
  min-width: 0;
}

.entity-name {
  font-size: 13px;
  font-weight: 500;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-type {
  font-size: 11px;
  color: #718096;
}

/* 加载状态 */
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
  color: #667eea;
}

.loading-spinner i {
  font-size: 24px;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar,
.relations-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track,
.relations-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.panel-content::-webkit-scrollbar-thumb,
.relations-content::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover,
.relations-content::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .node-detail-panel {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .node-detail-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    max-width: 400px;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .panel-content {
    max-height: calc(100vh - 100px);
  }
}
</style>
