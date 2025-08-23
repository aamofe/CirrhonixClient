<template>
  <div class="knowledge-graph">
    <div class="graph-search-bar">
      <input type="text" v-model="globalState.searchKeyword" @input="handleSearchKeywordChange($event.target.value)"
        placeholder="搜索节点..." />
    </div>

    <div class="graph-container">
      <GraphSidebar :graph-settings="globalState.graphSettings" @settings-change="handleSettingsChange"
        @reset-settings="handleResetSettings" />

      <div class="graph-main">
        <GraphVisualization :graph-data="graphData" :graph-settings="globalState.graphSettings"
          :is-loading="isLoading" />
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .graph-container {
    padding: 0 3%;
    gap: 20px;
  }
}

@media (max-width: 768px) {
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