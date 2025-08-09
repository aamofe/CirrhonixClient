<template>
  <div class="knowledge-graph">
    <!-- 顶部搜索栏 -->
    <div class="graph-search-bar">
      <!-- <h1>肝硬化知识图谱</h1> -->
      <!-- <p>可视化展示肝硬化相关研究的关键概念、文献间的引用关系及研究进展脉络</p> -->
      <input type="text" v-model="globalState.searchKeyword" @input="handleSearchKeywordChange($event.target.value)"
        placeholder="搜索节点..." />
    </div>

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
          :searchKeyword="searchKeyword" @node-selected="handleNodeSelected" @node-deselected="handleNodeDeselected" />
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
import GraphSidebar from '@/components/knowledge/GraphSidebar.vue'
import GraphVisualization from '@/components/knowledge/GraphVisualization.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

export default {
  name: 'KnowledgeGraph',
  components: {
    GraphSidebar,
    GraphVisualization,
    SiteFooter,
  },
  setup() {
    const router = useRouter()
    const { nodeTypes, relationTypes } = useNodeConfig()

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
    const searchKeyword = computed(() => globalState.searchKeyword)
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

    const graphVisualizationRef = ref(null)

    const selectedFilters = computed(() => ({
      selectedNodeTypes: globalState.selectedNodeTypes,
      selectedRelationTypes: globalState.selectedRelationTypes
    }))

    const handleNodeSelected = (node) => {
      globalState.selectedNode = node
    }

    const handleNodeDeselected = () => {
      globalState.selectedNode = null
    }

    const handleFocusNode = (nodeId) => {
      graphVisualizationRef.value?.focusOnNode(nodeId)
    }

    const handleViewArticle = (articleId) => {
      router.push(`/articles/${articleId}`)
    }

    const handleSearchKeywordChange = (keyword) => {
      globalState.searchKeyword = keyword
      graphVisualizationRef.value?.handleSearch(keyword)
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
      searchKeyword,
      globalState,
      graphData,
      isLoading,
      graphStats,
      popularConcepts,
      keyPapers,
      nodeTypes,
      relationTypes,
      selectedFilters,
      graphVisualizationRef,
      handleNodeSelected,
      handleNodeDeselected,
      handleFocusNode,
      handleViewArticle,
      handleSearchKeywordChange,
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

.graph-search-bar {
  padding: 30px 5%;
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  color: white;
}

.graph-search-bar h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.graph-search-bar p {
  margin-bottom: 20px;
  max-width: 800px;
}

.graph-search-bar input {
  width: 300px;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
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
