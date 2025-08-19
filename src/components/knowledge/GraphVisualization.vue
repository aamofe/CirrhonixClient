<template>
  <div class="graph-visualization" ref="graphContainer">
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">加载知识图谱中...</p>
    </div>

    <div class="background-grid">
      <svg class="grid-svg" width="100%" height="100%" viewBox="0 0 800 800">
        <circle cx="400" cy="400" r="50" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="130" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="200" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="270" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="340" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="410" fill="none" stroke="#ddd" stroke-width="1" opacity="0.8" />
        <circle cx="400" cy="400" r="480" fill="none" stroke="#ddd" stroke-width="1" opacity="0.8" />

        <line x1="400" y1="400" x2="400" y2="60" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="694.6" y2="230" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="694.6" y2="570" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="400" y2="740" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="105.4" y2="570" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="105.4" y2="230" stroke="#ddd" stroke-width="2" opacity="0.8" />
      </svg>
    </div>

    <div class="graph-canvas" ref="networkContainer"></div>

    <div class="graph-toolbar">
      <div class="toolbar-group">
        <button @click="zoomIn" class="toolbar-btn" title="放大">
          <el-icon>
            <ZoomIn />
          </el-icon>
        </button>
        <button @click="zoomOut" class="toolbar-btn" title="缩小">
          <el-icon>
            <ZoomOut />
          </el-icon>
        </button>
        <button @click="resetZoom" class="toolbar-btn" title="适应画面">
          <el-icon>
            <FullScreen />
          </el-icon>
        </button>
        <button @click="centerGraph" class="toolbar-btn" title="居中显示">
          <el-icon>
            <Aim />
          </el-icon>
        </button>
        <button @click="togglePhysics" class="toolbar-btn" :class="{ active: physicsEnabled }" title="物理引擎">
          <el-icon>
            <MagicStick />
          </el-icon>
        </button>
      </div>
    </div>

    <EdgeInfoCard :visible="showEdgeCard" :edge-data="selectedEdgeData" :position="cardPosition"
      @close="closeEdgeCard" />

    <NodeInfoCard :visible="showNodeCard" :node-data="selectedNodeData" :position="cardPosition" @close="closeNodeCard"
      @relation-updated="handleRelationUpdated" />

  </div>
</template>
<script>
import { ref } from 'vue'
import { ZoomIn, ZoomOut, FullScreen, Aim, MagicStick } from '@element-plus/icons-vue'
import EdgeInfoCard from './EdgeInfoCard.vue'
import NodeInfoCard from './NodeInfoCard.vue'
import { useGraphVisualization } from '@/composables/useGraphVisualization' // New composable

export default {
  name: 'GraphVisualization',
  components: { ZoomIn, ZoomOut, FullScreen, Aim, MagicStick, EdgeInfoCard, NodeInfoCard },
  props: {
    graphData: { type: Object, default: () => ({ nodes: [], edges: [] }) },
    graphSettings: { type: Object, required: true },
    isLoading: { type: Boolean, default: false },
  },
  setup(props) {
    const networkContainer = ref(null)

    const {
      network, // Exposed if you need direct vis.js network instance
      physicsEnabled,
      showEdgeCard,
      selectedEdgeData,
      cardPosition,
      showNodeCard,
      selectedNodeData,
      zoomIn,
      zoomOut,
      resetZoom,
      centerGraph,
      togglePhysics,
      focusOnEntity,
      closeEdgeCard,
      closeNodeCard,
      handleRelationUpdated,
      handleSearch // Exposed from composable
    } = useGraphVisualization(networkContainer, props)


    return {
      networkContainer,
      physicsEnabled,
      showEdgeCard,
      selectedEdgeData,
      cardPosition,
      showNodeCard,
      selectedNodeData,
      zoomIn,
      zoomOut,
      resetZoom,
      centerGraph,
      togglePhysics,
      focusOnEntity,
      closeEdgeCard,
      closeNodeCard,
      handleRelationUpdated,
    }
  }
}
</script>
<style scoped>
.graph-visualization {
  position: relative;
  width: 100%;
  height: 800px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.background-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.grid-svg {
  width: 100%;
  height: 100%;
}

.graph-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #666;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #666;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.graph-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
}

.layout-controls {
  display: flex;
  gap: 5px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  margin: 0 2px;
}

.toolbar-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.toolbar-btn.active {
  background: #333;
  color: white;
}

.graph-info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
  z-index: 100;
}

.info-row {
  display: flex;
  gap: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-value {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.info-label {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .graph-toolbar {
    top: 10px;
    right: 10px;
  }

  .graph-info-panel {
    bottom: 10px;
    left: 10px;
    padding: 12px 16px;
  }

  .info-row {
    gap: 16px;
  }
}
</style>