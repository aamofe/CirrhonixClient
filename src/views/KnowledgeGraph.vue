<template>
  <div class="knowledge-graph">
    <!-- 统一的头部样式 -->
    <section class="graph-header">
      <h1>知识图谱</h1>
      <p>展现最新的病原体、细胞、分子之间的关系</p>

      <!-- 搜索框移到头部 -->
      <div class="graph-search-container">
        <input type="text" v-model="globalState.searchKeyword" @input="handleSearchKeywordChange($event.target.value)"
          placeholder="搜索节点..." class="graph-search-input" />
      </div>
    </section>

    <div class="container">
      <div class="graph-container">
        <GraphSidebar :graph-settings="globalState.graphSettings" @settings-change="handleSettingsChange"
          @reset-settings="handleResetSettings" />

        <div class="graph-main">
          <GraphVisualization :graph-data="graphData" :graph-settings="globalState.graphSettings"
            :is-loading="isLoading" />
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphData } from '@/composables/useGraphData' // New composable
import bus from '@/utils/bus' // Import the event bus
import GraphSidebar from '@/components/knowledge/GraphSidebar.vue'
import GraphVisualization from '@/components/knowledge/GraphVisualization.vue'
import SiteFooter from '@/components/navigation/SiteFooter.vue'

export default {
  name: 'KnowledgeGraph',
  components: {
    GraphSidebar,
    GraphVisualization,
    SiteFooter,
  },
  setup() {
    const router = useRouter()

    const globalState = reactive({
      searchKeyword: '',
      selectedEntity: null, // Unified selected entity state
      graphSettings: {
        nodeSize: 10,
        edgeWidth: 2,
        showLabels: true,
        physics: true,
      }
    })

    // Use the new composable to fetch graph data
    const { graphData, isLoading, loadGraphData } = useGraphData()

    // Event handlers for bus
    const handleEntitySelected = (entity) => {
      globalState.selectedEntity = entity
    }

    const handleEntityDeselected = () => {
      globalState.selectedEntity = null
    }

    const handleGraphUpdated = () => {
      loadGraphData()
    }

    const handleSearchKeywordChange = (keyword) => {
      globalState.searchKeyword = keyword
      bus.emit('search-keyword', keyword) // Emit search event via bus
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

    // Bus event listeners
    onMounted(() => {
      bus.on('entity-selected', handleEntitySelected)
      bus.on('entity-deselected', handleEntityDeselected)
      bus.on('graph-updated', handleGraphUpdated)
    })

    onBeforeUnmount(() => {
      bus.off('entity-selected', handleEntitySelected)
      bus.off('entity-deselected', handleEntityDeselected)
      bus.off('graph-updated', handleGraphUpdated)
    })

    return {
      globalState,
      graphData,
      isLoading,
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
  position: relative;
}

/* 统一的头部样式 - 参考 LiteratureListPage */
.graph-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 40px 5%;
  text-align: center;
  position: relative;
}

.graph-header h1 {
  color: white;
  font-size: 28px;
  margin-bottom: 10px;
}

.graph-header p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.graph-search-container {
  max-width: 400px;
  margin: 0 auto;
}

.graph-search-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.graph-search-input:focus {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.container {
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 5%;
}

.graph-container {
  display: flex;
  gap: 30px;
}

.graph-main {
  flex: 1;
  position: relative;
  min-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .container {
    padding: 0 3%;
  }

  .graph-container {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .graph-container {
    flex-direction: column;
  }

  .graph-header {
    padding: 30px 20px;
  }

  .container {
    padding: 0 20px;
  }
}
</style>