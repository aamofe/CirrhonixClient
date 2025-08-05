<!-- src/views/KnowledgeGraph.vue -->
<template>
  <div class="knowledge-graph">
    <!-- 页面头部 -->
    <GraphHeader v-model:search-keyword="globalState.searchKeyword" v-model:current-view="globalState.currentView"
      v-model:selected-node-types="globalState.selectedNodeTypes"
      v-model:selected-relation-types="globalState.selectedRelationTypes" :node-types="nodeTypes"
      :relation-types="relationTypes" @search-keyword-change="handleSearchKeywordChange"
      @filter-change="handleFilterChange" />

    <!-- 主要内容区域 -->
    <div class="graph-container">
      <!-- 左侧边栏 -->
      <GraphSidebar :graph-stats="graphStats" :popular-concepts="popularConcepts" :key-papers="keyPapers"
        :graph-settings="globalState.graphSettings" @focus-node="handleFocusNode" @view-article="handleViewArticle"
        @settings-change="handleSettingsChange" @reset-settings="handleResetSettings" />

      <!-- 主图谱区域 -->
      <div class="graph-main">
        <GraphVisualization ref="graphVisualizationRef" :current-view="globalState.currentView" :graph-data="graphData"
          :graph-settings="globalState.graphSettings" :selected-filters="selectedFilters" :is-loading="isLoading"
          @node-selected="handleNodeSelected" @node-deselected="handleNodeDeselected" />

        <!-- 节点详情面板 -->

      </div>
    </div>

    <!-- 页脚组件 -->
    <SiteFooter />
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNodeConfig } from '@/composables/useNodeConfig'
import GraphHeader from '@/components/knowledge/GraphHeader.vue'
import GraphSidebar from '@/components/knowledge/GraphSidebar.vue'
import GraphVisualization from '@/components/knowledge/GraphVisualization.vue'
// import NodeDetailPanel from '@/components/knowledge/NodeDetailPanel.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

export default {
  name: 'KnowledgeGraph',
  components: {
    GraphHeader,
    GraphSidebar,
    GraphVisualization,
    // NodeDetailPanel,
    SiteFooter,
  },
  setup() {
    const router = useRouter()
    const { nodeTypes, relationTypes } = useNodeConfig()

    // 全局状态管理
    const globalState = reactive({
      searchKeyword: '',
      currentView: 'concept',
      selectedNode: null,
      selectedNodeTypes: [],
      selectedRelationTypes: [],
      graphSettings: {
        nodeSize: 10,
        edgeWidth: 2,
        showLabels: true,
        physics: true,
      }
    })

    // 数据状态
    const graphData = ref({ nodes: [], edges: [] })
    const isLoading = ref(false)
    const graphStats = ref({
      totalNodes: 0,
      totalEdges: 0,
      nodeTypes: {},
      relationTypes: {}
    })
    const popularConcepts = ref([])
    const keyPapers = ref([])

    // 组件引用
    const graphVisualizationRef = ref(null)

    // 计算属性 - 构建过滤条件对象
    const selectedFilters = computed(() => ({
      selectedNodeTypes: globalState.selectedNodeTypes,
      selectedRelationTypes: globalState.selectedRelationTypes
    }))

    // 事件处理
    const handleNodeSelected = (node) => {
      globalState.selectedNode = node
    }

    const handleNodeDeselected = () => {
      globalState.selectedNode = null
    }

    const handleCloseNodeDetail = () => {
      globalState.selectedNode = null
    }

    const handleFocusNode = (nodeId) => {
      if (graphVisualizationRef.value) {
        graphVisualizationRef.value.focusOnNode(nodeId)
      }
    }

    const handleViewArticle = (articleId) => {
      router.push(`/articles/${articleId}`)
    }

    const handleSearchKeywordChange = (keyword) => {
      globalState.searchKeyword = keyword
      if (graphVisualizationRef.value) {
        graphVisualizationRef.value.searchNodes(keyword)
      }
    }

    const handleFilterChange = () => {
      // 通知子组件重新加载数据
      if (graphVisualizationRef.value) {
        graphVisualizationRef.value.reloadData()
      }
    }

    const handleSettingsChange = (settings) => {
      Object.assign(globalState.graphSettings, settings)
    }

    const handleResetSettings = () => {
      globalState.graphSettings = {
        nodeSize: 10,
        edgeWidth: 2,
        showLabels: true,
        physics: true,
      }
    }

    return {
      // 状态
      globalState,
      graphData,
      isLoading,
      graphStats,
      popularConcepts,
      keyPapers,

      // 配置
      nodeTypes,
      relationTypes,

      // 计算属性
      selectedFilters,

      // 引用
      graphVisualizationRef,

      // 事件处理方法
      handleNodeSelected,
      handleNodeDeselected,
      handleCloseNodeDetail,
      handleFocusNode,
      handleViewArticle,
      handleSearchKeywordChange,
      handleFilterChange,
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