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
          :search-keyword="searchKeyword" :task-id="taskId" @entity-selected="handleEntitySelected"
          @entity-deselected="handleEntityDeselected" @node-selected="handleNodeSelected"
          @node-deselected="handleNodeDeselected" />
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
import { Close } from '@element-plus/icons-vue'
import GraphSidebar from '@/components/knowledge/GraphSidebar.vue'
import GraphVisualization from '@/components/knowledge/GraphVisualization.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

export default {
  name: 'KnowledgeGraph',
  components: {
    GraphSidebar,
    GraphVisualization,
    SiteFooter,
    Close
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
    const taskId = ref(null) // 如果需要加载特定任务的图谱，设置任务ID
    const selectedEntity = ref(null) // 选中的实体

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

    // 新的实体选择处理（用于边点击等新功能）
    const handleEntitySelected = (entity) => {
      selectedEntity.value = entity
      console.log('选中实体:', entity)

      // 可以在这里添加更多逻辑，比如加载实体的详细信息
      // await loadEntityDetails(entity.id)
    }

    const handleEntityDeselected = () => {
      selectedEntity.value = null
      console.log('取消选中实体')
    }

    // 兼容原有的节点选择处理
    const handleNodeSelected = (node) => {
      globalState.selectedNode = node
      // 也可以设置为选中的实体
      if (!selectedEntity.value) {
        selectedEntity.value = node
      }
    }

    const handleNodeDeselected = () => {
      globalState.selectedNode = null
      // 如果没有其他实体被选中，清除选中状态
      if (selectedEntity.value === globalState.selectedNode) {
        selectedEntity.value = null
      }
    }

    const handleFocusNode = (nodeId) => {
      graphVisualizationRef.value?.focusOnNode?.(nodeId) ||
        graphVisualizationRef.value?.focusOnEntity?.(nodeId)
    }

    const handleViewArticle = (articleId) => {
      router.push(`/articles/${articleId}`)
    }

    const handleSearchKeywordChange = (keyword) => {
      globalState.searchKeyword = keyword
      // 调用图谱组件的搜索方法
      graphVisualizationRef.value?.handleSearch?.(keyword)
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

    // 程序化控制方法
    const focusOnEntity = (entityName) => {
      graphVisualizationRef.value?.focusOnEntity?.(entityName)
    }

    const searchEntity = (keyword) => {
      globalState.searchKeyword = keyword
      graphVisualizationRef.value?.handleSearch?.(keyword)
    }

    return {
      searchKeyword,
      globalState,
      graphData,
      isLoading,
      taskId,
      selectedEntity,
      graphStats,
      popularConcepts,
      keyPapers,
      nodeTypes,
      relationTypes,
      selectedFilters,
      graphVisualizationRef,
      handleEntitySelected,
      handleEntityDeselected,
      handleNodeSelected,
      handleNodeDeselected,
      handleFocusNode,
      handleViewArticle,
      handleSearchKeywordChange,
      handleSettingsChange,
      handleResetSettings,
      focusOnEntity,
      searchEntity,
    }
  },
}
</script>

<style scoped>
.knowledge-graph {
  background-color: #f5fbff;
  min-height: 100vh;
  position: relative;
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

/* 实体详情面板样式 */
.entity-panel {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 320px;
  max-height: 70vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e1e5e9;
  z-index: 200;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  max-width: 240px;
  word-break: break-word;
}

.close-panel-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-panel-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(70vh - 60px);
}

.panel-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #555;
  line-height: 1.5;
}

.panel-content strong {
  color: #333;
  font-weight: 600;
}

.entity-description {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f3f4;
}

.entity-description p {
  margin-top: 8px;
  color: #666;
  line-height: 1.6;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .entity-panel {
    right: 10px;
    width: 280px;
  }

  .graph-container {
    padding: 0 3%;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .entity-panel {
    position: fixed;
    top: auto;
    bottom: 20px;
    right: 20px;
    left: 20px;
    width: auto;
    transform: none;
    max-height: 40vh;
  }

  .graph-container {
    flex-direction: column;
    padding: 0 20px;
  }

  .graph-search-bar {
    padding: 20px;
  }

  .graph-search-bar input {
    width: 100%;
    max-width: 300px;
  }
}
</style>