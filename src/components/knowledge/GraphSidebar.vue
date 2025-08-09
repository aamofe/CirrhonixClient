<!-- src/components/knowledge/GraphSidebar.vue -->
<template>
  <div class="graph-sidebar">
    <!-- 图谱统计 -->
    <div class="sidebar-card">
      <h3>图谱统计</h3>
      <div v-if="isLoading" class="loading-state">
        加载中...
      </div>
      <div v-else>
        <div class="stats-item">
          <span class="stats-label">节点总数:</span>
          <span class="stats-value">{{ graphStats.totalNodes }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">关系总数:</span>
          <span class="stats-value">{{ graphStats.totalRelations }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">文献数量:</span>
          <span class="stats-value">{{ graphStats.literatureCount }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">概念数量:</span>
          <span class="stats-value">{{ graphStats.conceptCount }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">作者数量:</span>
          <span class="stats-value">{{ graphStats.authorCount }}</span>
        </div>
      </div>
    </div>

    <!-- 图谱设置 -->
    <div class="sidebar-card">
      <h3>图谱设置</h3>
      <div class="setting-item">
        <span class="setting-label">节点大小:</span>
        <input type="range" :value="graphSettings.nodeSize" min="1" max="20"
          @input="updateSetting('nodeSize', $event.target.value)" />
        <span class="setting-value">{{ graphSettings.nodeSize }}</span>
      </div>
      <div class="setting-item">
        <span class="setting-label">边线粗细:</span>
        <input type="range" :value="graphSettings.edgeWidth" min="1" max="10"
          @input="updateSetting('edgeWidth', $event.target.value)" />
        <span class="setting-value">{{ graphSettings.edgeWidth }}</span>
      </div>
      <div class="setting-item">
        <span class="setting-label">显示标签:</span>
        <input type="checkbox" :checked="graphSettings.showLabels"
          @change="updateSetting('showLabels', $event.target.checked)" />
      </div>
      <div class="setting-item">
        <span class="setting-label">物理引擎:</span>
        <input type="checkbox" :checked="graphSettings.physics"
          @change="updateSetting('physics', $event.target.checked)" />
      </div>
      <div class="setting-actions">
        <button @click="resetSettings" class="reset-btn">
          重置设置
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import KnowledgeGraph from '@/api/knowledgeGraph'

export default {
  name: 'GraphSidebar',
  props: {
    graphStats: Object,
    popularConcepts: Array,
    keyPapers: Array,
    graphSettings: Object,
  },
  emits: ['focus-node', 'view-article', 'settings-change', 'reset-settings'],
  setup(props, { emit }) {
    // 组件内部管理统计数据
    const graphStats = reactive({
      totalNodes: 0,
      totalRelations: 0,
      literatureCount: 0,
      conceptCount: 0,
      authorCount: 0,
    })

    const popularConcepts = ref([])
    const keyPapers = ref([])
    const isLoading = ref(false)

    // 加载统计数据 - 从父组件移到子组件
    const loadStatistics = async () => {
      try {
        isLoading.value = true
        const response = await KnowledgeGraph.statistics()

        if (response.data.data) {
          const data = response.data.data

          // 更新基础统计
          if (data.basic_stats) {
            Object.assign(graphStats, {
              totalNodes: data.basic_stats.total_entities,
              totalRelations: data.basic_stats.total_relations,
              literatureCount: data.basic_stats.literature_count || 0,
              conceptCount: data.basic_stats.concept_count || 0,
              authorCount: data.basic_stats.author_count || 0,
            })
          }

          // 更新热门概念
          if (data.top_active_entities) {
            popularConcepts.value = data.top_active_entities
              .slice(0, 10)
              .map((item) => ({
                id: item.entity.id,
                name: item.entity.name,
                count: item.total_relations,
              }))
          }

          // 更新核心文献
          if (data.key_papers) {
            keyPapers.value = data.key_papers.slice(0, 5)
          }
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const updateSetting = (key, value) => {
      const newSettings = { ...props.graphSettings }
      newSettings[key] = typeof value === 'string' && !isNaN(value) ? Number(value) : value
      emit('settings-change', newSettings)
    }

    const resetSettings = () => {
      emit('reset-settings')
    }

    const focusOnConcept = (conceptId) => {
      emit('focus-node', conceptId)
    }

    const viewArticle = (articleId) => {
      emit('view-article', articleId)
    }

    // 刷新统计数据
    const refreshStatistics = () => {
      loadStatistics()
    }

    onMounted(() => {
      loadStatistics()
    })

    return {
      // 状态
      graphStats,
      popularConcepts,
      keyPapers,
      isLoading,

      // 方法
      updateSetting,
      resetSettings,
      focusOnConcept,
      viewArticle,
      refreshStatistics,
    }
  },
}
</script>
<style scoped>
.graph-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.sidebar-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.sidebar-card h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.stats-item:last-child {
  border-bottom: none;
}

.stats-label {
  color: #666;
  font-size: 14px;
}

.stats-value {
  color: #1a91c1;
  font-weight: 500;
}

.popular-list {
  max-height: 200px;
  overflow-y: auto;
}

.popular-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.popular-item:hover {
  background-color: #f8f9fa;
  margin: 0 -10px;
  padding: 10px 10px;
}

.popular-item:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  font-size: 14px;
  color: #333;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 20px 0;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.setting-label {
  width: 80px;
  font-size: 14px;
  color: #333;
  margin-right: 10px;
}

.setting-item input[type='range'] {
  flex: 1;
  margin-right: 10px;
}

.setting-item input[type='checkbox'] {
  margin-left: auto;
}

.setting-value {
  width: 30px;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.setting-actions {
  margin-top: 20px;
  text-align: center;
}

.reset-btn {
  background: #f5f5f5;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #e0e0e0;
}
</style>
