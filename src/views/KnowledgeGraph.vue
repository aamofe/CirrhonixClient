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
        <NodeDetailPanel v-if="globalState.selectedNode" :node="globalState.selectedNode" @close="handleCloseNodeDetail"
          @view-article="handleViewArticle" @focus-node="handleFocusNode" />
      </div>
    </div>

    <site-footer />
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useNodeConfig } from '@/composables/useNodeConfig'
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

    // 组件引用
    const graphVisualizationRef = ref(null)

    // 事件处理 - 只处理组件间的通信协调
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
        graphVisualizationRef.value.focusNode(nodeId)
      }
    }

    const handleViewArticle = (articleId) => {
      this.$router.push(`/articles/${articleId}`)
    }

    const handleSearchKeywordChange = (keyword) => {
      globalState.searchKeyword = keyword
      if (graphVisualizationRef.value) {
        graphVisualizationRef.value.searchNodes(keyword)
      }
    }

    const handleFilterChange = () => {
      // 通知子组件重新加载数据，具体加载逻辑在子组件中
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
      globalState,
      nodeTypes,
      relationTypes,
      graphVisualizationRef,

      // 事件处理
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