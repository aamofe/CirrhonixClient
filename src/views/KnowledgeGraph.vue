<!-- src/views/KnowledgeGraph.vue -->
<template>
  <div class="knowledge-graph">
    <!-- 页面头部 -->
    <GraphHeader
      v-model:search-keyword="searchKeyword"
      v-model:current-view="currentView"
      v-model:selected-node-types="selectedNodeTypes"
      v-model:selected-relation-types="selectedRelationTypes"
      :node-types="nodeTypes"
      :relation-types="relationTypes"
      @filter-change="handleFilterChange"
    />

    <!-- 主要内容区域 -->
    <div class="graph-container">
      <!-- 左侧边栏 -->
      <GraphSidebar
        :graph-stats="graphStats"
        :popular-concepts="popularConcepts"
        :key-papers="keyPapers"
        :graph-settings="graphSettings"
        @focus-node="handleFocusNode"
        @view-article="handleViewArticle"
        @settings-change="handleSettingsChange"
        @reset-settings="handleResetSettings"
      />

      <!-- 主图谱区域 -->
      <div class="graph-main">
        <GraphVisualization
          ref="graphVisualization"
          :current-view="currentView"
          :graph-data="graphData"
          :graph-settings="graphSettings"
          :selected-filters="selectedFilters"
          :is-loading="isLoading"
          @node-selected="handleNodeSelected"
          @node-deselected="handleNodeDeselected"
        />

        <!-- 节点详情面板 -->
        <NodeDetailPanel
          v-if="selectedNode"
          :node="selectedNode"
          @close="handleCloseNodeDetail"
          @view-article="handleViewArticle"
          @focus-node="handleFocusNode"
        />
      </div>
    </div>

    <site-footer />
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import KnowledgeGraph from '@/api/knowledgeGraph'
import GraphHeader from '@/components/knowledge/GraphHeader.vue'
import GraphSidebar from '@/components/knowledge/GraphSidebar.vue'
import GraphVisualization from '@/components/knowledge/GraphVisualization.vue'
import NodeDetailPanel from '@/components/knowledge/NodeDetailPanel.vue'

export default {
  name: 'KnowledgeGraph',
  components: {
    GraphHeader,
    GraphSidebar,
    GraphVisualization,
    NodeDetailPanel,
  },
  setup() {
    // 响应式数据
    const searchKeyword = ref('')
    const currentView = ref('concept')
    const selectedNode = ref(null)
    const isLoading = ref(false)
    const graphData = ref({ nodes: [], edges: [] })

    // 过滤器相关
    const selectedNodeTypes = ref([])
    const selectedRelationTypes = ref([])

    // 节点和关系类型配置
    const nodeTypes = ref([
      { label: '病原体', value: 'pathogen' },
      { label: '感染部位', value: 'infection_site' },
      { label: '临床症状', value: 'clinical_symptom' },
      { label: '诊断方法', value: 'diagnosis_method' },
      { label: '治疗方案', value: 'treatment_plan' },
      { label: '预防策略', value: 'prevention_strategy' },
      { label: '肝硬化阶段', value: 'cirrhosis_stage' },
      { label: '并发症', value: 'complication' },
    ])

    const relationTypes = ref([
      { label: '致病', value: 'causes' },
      { label: '表现为', value: 'manifests_as' },
      { label: '诊断依据', value: 'diagnosed_by' },
      { label: '治疗方法', value: 'treated_with' },
      { label: '并发', value: 'complicates_with' },
      { label: '预防', value: 'prevented_by' },
      { label: '抗性', value: 'resistant_to' },
      { label: '协同作用', value: 'synergizes_with' },
      { label: '发生在', value: 'occurs_in' },
      { label: '关联', value: 'associated_with' },
    ])

    // 图谱统计数据
    const graphStats = reactive({
      totalNodes: 0,
      totalRelations: 0,
      literatureCount: 0,
      conceptCount: 0,
      authorCount: 0,
    })

    // 热门概念和核心文献
    const popularConcepts = ref([])
    const keyPapers = ref([])

    // 图谱设置
    const graphSettings = reactive({
      nodeSize: 10,
      edgeWidth: 2,
      showLabels: true,
      physics: true,
    })

    // 计算属性：选中的过滤器
    const selectedFilters = computed(() => ({
      search: searchKeyword.value,
      nodeTypes: selectedNodeTypes.value,
      relationTypes: selectedRelationTypes.value,
      view: currentView.value,
    }))

    // 方法定义
    const loadGraphData = async () => {
      try {
        isLoading.value = true

        // 构建过滤参数
        const params = {
          verified_only: false,
          limit: 500,
        }

        // 添加类型过滤
        if (selectedNodeTypes.value.length > 0) {
          params.type = selectedNodeTypes.value.join(',')
        }
        if (selectedRelationTypes.value.length > 0) {
          params.relation_type = selectedRelationTypes.value.join(',')
        }

        const response = await KnowledgeGraph.getGraph(params)
        if (response.data) {
          graphData.value = {
            nodes: response.data.nodes || [],
            edges: response.data.edges || [],
          }

          // 更新统计信息
          const stats = response.data.statistics
          if (stats) {
            graphStats.totalNodes = stats.total_entities || 0
            graphStats.totalRelations = stats.total_relations || 0
            graphStats.literatureCount = stats.literature_count || 0
            graphStats.conceptCount = stats.concept_count || 0
            graphStats.authorCount = stats.author_count || 0
          }
        }
      } catch (error) {
        console.error('加载图谱数据失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const loadStatistics = async () => {
      try {
        const response = await KnowledgeGraph.statistics()
        if (response.data) {
          const data = response.data

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
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }

    // 事件处理方法
    const handleFilterChange = () => {
      loadGraphData()
    }

    const handleFocusNode = (nodeId) => {
      if (graphVisualization.value) {
        graphVisualization.value.focusNode(nodeId)
      }
    }

    const handleViewArticle = (articleId) => {
      // 跳转到文献详情页面
      this.$router.push(`/articles/${articleId}`)
    }

    const handleNodeSelected = (node) => {
      selectedNode.value = node
    }

    const handleNodeDeselected = () => {
      selectedNode.value = null
    }

    const handleCloseNodeDetail = () => {
      selectedNode.value = null
    }

    const handleSettingsChange = (newSettings) => {
      Object.assign(graphSettings, newSettings)
    }

    const handleResetSettings = () => {
      Object.assign(graphSettings, {
        nodeSize: 10,
        edgeWidth: 2,
        showLabels: true,
        physics: true,
      })
    }

    // 监听器
    watch([selectedNodeTypes, selectedRelationTypes], () => {
      handleFilterChange()
    })

    watch(searchKeyword, (newValue) => {
      if (graphVisualization.value) {
        graphVisualization.value.searchNodes(newValue)
      }
    })

    // 生命周期
    onMounted(() => {
      loadGraphData()
      loadStatistics()
    })

    return {
      // 响应式数据
      searchKeyword,
      currentView,
      selectedNode,
      isLoading,
      graphData,
      selectedNodeTypes,
      selectedRelationTypes,
      nodeTypes,
      relationTypes,
      graphStats,
      popularConcepts,
      keyPapers,
      graphSettings,
      selectedFilters,

      // 方法
      handleFilterChange,
      handleFocusNode,
      handleViewArticle,
      handleNodeSelected,
      handleNodeDeselected,
      handleCloseNodeDetail,
      handleSettingsChange,
      handleResetSettings,
    }
  },
}
</script>

<style scoped>
.knowledge-graph {
  background-color: #f5fbff;
  min-height: 100vh;
}

.graph-container {
  display: flex;
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 5%;
  gap: 30px;
}

.graph-main {
  flex: 1;
  position: relative;
  min-height: 600px;
}
</style>
