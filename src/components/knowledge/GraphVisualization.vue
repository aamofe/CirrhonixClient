<!-- src/components/knowledge/GraphVisualization.vue -->
<template>
  <div class="graph-visualization" ref="graphContainer">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>加载知识图谱中...</p>
    </div>

    <!-- 图谱画布 -->
    <div class="graph-canvas" ref="networkContainer"></div>

    <!-- 图谱工具栏 -->
    <div class="graph-toolbar">
      <div class="toolbar-group">
        <button @click="zoomIn" class="toolbar-btn" title="放大">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
        <button @click="zoomOut" class="toolbar-btn" title="缩小">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        </button>
        <button @click="resetZoom" class="toolbar-btn" title="重置缩放">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>
      </div>
      <div class="toolbar-group">
        <button @click="centerGraph" class="toolbar-btn" title="居中显示">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button @click="togglePhysics" class="toolbar-btn" :class="{ active: physicsEnabled }" title="物理引擎">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </button>
        <button @click="exportImage" class="toolbar-btn" title="导出图片">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 图谱信息面板 -->
    <div class="graph-info-panel" v-if="graphData.nodes && graphData.nodes.length > 0">
      <div class="info-item">
        <span class="info-label">节点:</span>
        <span class="info-value">{{ visibleNodes }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">关系:</span>
        <span class="info-value">{{ visibleEdges }}</span>
      </div>
      <div class="info-item" v-if="selectedNodeCount > 0">
        <span class="info-label">已选:</span>
        <span class="info-value">{{ selectedNodeCount }}</span>
      </div>
    </div>

    <!-- 搜索结果提示 -->
    <div class="search-results" v-if="searchedNodes.length > 0">
      <div class="search-header">
        <span>搜索结果 ({{ searchedNodes.length }})</span>
        <button @click="clearSearch" class="clear-btn">清除</button>
      </div>
      <div class="search-list">
        <div v-for="node in searchedNodes" :key="node.id" class="search-item" @click="focusOnNode(node.id)">
          <span class="node-name">{{ node.label || node.name }}</span>
          <span class="node-type">{{ getNodeTypeDisplay(node.type) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useNodeConfig } from '@/composables/useNodeConfig'
import KnowledgeGraph from '@/api/knowledgeGraph'

export default {
  name: 'GraphVisualization',
  props: {
    currentView: {
      type: String,
      default: 'concept',
    },
    graphData: {
      type: Object,
      default: () => ({ nodes: [], edges: [] })
    },
    graphSettings: {
      type: Object,
      required: true,
    },
    selectedFilters: {
      type: Object,
      default: () => ({})
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['node-selected', 'node-deselected'],
  setup(props, { emit }) {
    const { getNodeColor, getNodeLabel } = useNodeConfig()

    // 组件内部状态
    const networkContainer = ref(null)
    const network = ref(null)
    const graphData = ref({ nodes: [], edges: [] })
    const searchedNodes = ref([])
    const selectedNodeCount = ref(0)
    const physicsEnabled = ref(true)

    // 计算属性
    const visibleNodes = computed(() => {
      return graphData.value.nodes ? graphData.value.nodes.length : 0
    })

    const visibleEdges = computed(() => {
      return graphData.value.edges ? graphData.value.edges.length : 0
    })

    const loadGraphData = async () => {
      try {
        const params = {
          verified_only: false,
          limit: 500,
        }

        if (props.selectedFilters.selectedNodeTypes?.length > 0) {
          params.type = props.selectedFilters.selectedNodeTypes.join(',')
        }
        if (props.selectedFilters.selectedRelationTypes?.length > 0) {
          params.relation_type = props.selectedFilters.selectedRelationTypes.join(',')
        }

        const response = await KnowledgeGraph.getGraph(params)
        if (response.data.data) {
          graphData.value = {
            nodes: response.data.data.nodes || [],
            edges: response.data.data.edges || [],
          }

          // 重新初始化网络图
          await nextTick()
          initializeNetwork()
        }
      } catch (error) {
        console.error('加载图谱数据失败:', error)
      }
    }

    // 获取节点大小
    const getNodeSize = (node) => {
      const baseSize = props.graphSettings.nodeSize || 10
      const connections = node.connections || 0
      return Math.max(
        baseSize,
        Math.min(baseSize + connections * 2, baseSize * 3)
      )
    }

    // 获取节点类型显示名称
    const getNodeTypeDisplay = (type) => {
      return getNodeLabel(type)
    }

    // 初始化网络图
    const initializeNetwork = async () => {
      if (!networkContainer.value || !graphData.value.nodes.length) {
        return
      }

      try {
        if (!window.vis) {
          await loadVisNetwork()
        }

        const { DataSet } = window.vis

        // 处理节点数据
        const nodes = new DataSet(
          graphData.value.nodes.map((node) => ({
            id: node.id,
            label: props.graphSettings.showLabels
              ? node.name || node.label
              : '',
            title: `${node.name || node.label}\n类型: ${getNodeLabel(node.type)}\n${node.description || ''}`,
            group: node.type,
            color: {
              background: getNodeColor(node.type),
              border: getNodeColor(node.type),
              highlight: {
                background: '#ffd32a',
                border: '#ff8c00',
              },
            },
            size: getNodeSize(node),
            font: {
              size: 12,
              color: '#333',
            },
            physics: physicsEnabled.value,
          }))
        )

        // 处理边数据
        const edges = new DataSet(
          (graphData.value.edges || []).map((edge) => ({
            id: edge.id,
            from: edge.source,
            to: edge.target,
            label: edge.label || '',
            title: `关系: ${edge.label}\n支持度: ${edge.support_degree || 0}%`,
            width: props.graphSettings.edgeWidth || 2,
            color: {
              color: '#848484',
              highlight: '#ff8c00',
              opacity: edge.is_verified ? 1.0 : 0.6,
            },
            smooth: {
              type: 'continuous',
            },
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 1,
              },
            },
          }))
        )

        // 网络配置
        const options = {
          physics: {
            enabled: physicsEnabled.value,
            stabilization: { iterations: 100 },
            solver: 'barnesHut',
            barnesHut: {
              gravitationalConstant: -2000,
              centralGravity: 0.3,
              springLength: 95,
              springConstant: 0.04,
              damping: 0.09,
            },
          },
          interaction: {
            hover: true,
            selectConnectedEdges: false,
            tooltipDelay: 200,
          },
          nodes: {
            borderWidth: 2,
            shadow: true,
            font: {
              size: 12,
            },
          },
          edges: {
            shadow: true,
            smooth: {
              type: 'continuous',
            },
          },
          layout: {
            improvedLayout: true,
          },
        }

        // 创建网络
        network.value = new window.vis.Network(
          networkContainer.value,
          { nodes, edges },
          options
        )

        // 添加事件监听器
        setupEventListeners()
      } catch (error) {
        console.error('初始化网络图失败:', error)
      }
    }

    // 加载vis-network库
    const loadVisNetwork = () => {
      return new Promise((resolve, reject) => {
        if (window.vis) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js'
        script.onload = () => {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css'
          document.head.appendChild(link)
          resolve()
        }
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    // 设置事件监听器
    const setupEventListeners = () => {
      if (!network.value) return

      // 节点选择事件
      network.value.on('selectNode', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const nodeData = graphData.value.nodes.find((n) => n.id === nodeId)
          if (nodeData) {
            emit('node-selected', nodeData)
          }
        }
        selectedNodeCount.value = params.nodes.length
      })

      // 节点取消选择事件
      network.value.on('deselectNode', () => {
        emit('node-deselected')
        selectedNodeCount.value = 0
      })

      // 双击节点事件
      network.value.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          focusOnNode(nodeId)
        }
      })

      // 稳定化完成事件
      network.value.on('stabilizationIterationsDone', () => {
        network.value.setOptions({ physics: false })
      })
    }

    // 工具栏功能
    const zoomIn = () => {
      if (network.value) {
        const scale = network.value.getScale()
        network.value.moveTo({ scale: scale * 1.2 })
      }
    }

    const zoomOut = () => {
      if (network.value) {
        const scale = network.value.getScale()
        network.value.moveTo({ scale: scale * 0.8 })
      }
    }

    const resetZoom = () => {
      if (network.value) {
        network.value.fit()
      }
    }

    const centerGraph = () => {
      if (network.value) {
        network.value.fit({
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad',
          },
        })
      }
    }

    const togglePhysics = () => {
      physicsEnabled.value = !physicsEnabled.value
      if (network.value) {
        network.value.setOptions({
          physics: { enabled: physicsEnabled.value },
        })
      }
    }

    const exportImage = () => {
      if (network.value) {
        const canvas = network.value.canvas.frame.canvas
        const link = document.createElement('a')
        link.download = `knowledge-graph-${Date.now()}.png`
        link.href = canvas.toDataURL()
        link.click()
      }
    }

    // 搜索功能
    const searchNodes = (keyword) => {
      if (!keyword || !graphData.value.nodes) {
        searchedNodes.value = []
        if (network.value) {
          network.value.selectNodes([])
        }
        return
      }

      const results = graphData.value.nodes.filter(
        (node) =>
          (node.name || node.label || '')
            .toLowerCase()
            .includes(keyword.toLowerCase()) ||
          (node.description || '').toLowerCase().includes(keyword.toLowerCase())
      )

      searchedNodes.value = results

      if (network.value && results.length > 0) {
        const nodeIds = results.map((node) => node.id)
        network.value.selectNodes(nodeIds)
        if (results.length === 1) {
          focusOnNode(results[0].id)
        }
      }
    }

    // 清除搜索
    const clearSearch = () => {
      searchedNodes.value = []
      if (network.value) {
        network.value.selectNodes([])
      }
    }

    // 聚焦到指定节点
    const focusOnNode = (nodeId) => {
      if (network.value) {
        network.value.focus(nodeId, {
          scale: 1.5,
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad',
          },
        })
        network.value.selectNodes([nodeId])
      }
    }

    // 重新加载数据 - 暴露给父组件调用
    const reloadData = () => {
      loadGraphData()
    }

    // 监听器 - 监听过滤条件变化
    watch(
      () => props.selectedFilters,
      () => {
        loadGraphData()
      },
      { deep: true }
    )

    watch(
      () => props.graphSettings,
      () => {
        if (network.value) {
          initializeNetwork()
        }
      },
      { deep: true }
    )

    // 生命周期
    onMounted(() => {
      loadGraphData()
    })

    onBeforeUnmount(() => {
      if (network.value) {
        network.value.destroy()
      }
    })

    // 暴露方法给父组件
    return {
      // refs
      networkContainer,

      // 计算属性
      visibleNodes,
      visibleEdges,

      // 状态
      searchedNodes,
      selectedNodeCount,
      physicsEnabled,

      // 方法
      zoomIn,
      zoomOut,
      resetZoom,
      centerGraph,
      togglePhysics,
      exportImage,
      searchNodes,
      clearSearch,
      focusOnNode,
      reloadData,
      getNodeTypeDisplay,
    }
  },
}
</script>

<style scoped>
.graph-visualization {
  position: relative;
  width: 100%;
  height: 600px;
  background: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  overflow: hidden;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.graph-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 100;
}

.toolbar-group {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.toolbar-btn.active {
  background: #3498db;
  color: white;
}

.graph-info-panel {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  z-index: 100;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #666;
  margin-right: 8px;
  min-width: 40px;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.search-results {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 280px;
  max-height: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px;
  font-weight: 600;
}

.clear-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: #dee2e6;
}

.search-list {
  max-height: 240px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s;
}

.search-item:hover {
  background: #f8f9fa;
}

.search-item:last-child {
  border-bottom: none;
}

.node-name {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.node-type {
  font-size: 12px;
  color: #666;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 12px;
}
</style>
