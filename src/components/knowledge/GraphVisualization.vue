<!-- src/components/knowledge/GraphVisualization.vue -->
<template>
  <div class="graph-visualization" ref="graphContainer">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">加载知识图谱中...</p>
    </div>

    <!-- 图谱画布 -->
    <div class="graph-canvas" ref="networkContainer"></div>

    <!-- 图谱工具栏 -->
    <div class="graph-toolbar">
      <div class="toolbar-group">
        <el-tooltip content="放大" placement="bottom">
          <button @click="zoomIn" class="toolbar-btn">
            <el-icon>
              <ZoomIn />
            </el-icon>
          </button>
        </el-tooltip>

        <el-tooltip content="缩小" placement="bottom">
          <button @click="zoomOut" class="toolbar-btn">
            <el-icon>
              <ZoomOut />
            </el-icon>
          </button>
        </el-tooltip>

        <el-tooltip content="适应画面" placement="bottom">
          <button @click="resetZoom" class="toolbar-btn">
            <el-icon>
              <FullScreen />
            </el-icon>
          </button>
        </el-tooltip>

        <div class="toolbar-divider"></div>

        <el-tooltip content="居中显示" placement="bottom">
          <button @click="centerGraph" class="toolbar-btn">
            <el-icon>
              <Aim />
            </el-icon>
          </button>
        </el-tooltip>

        <el-tooltip content="物理引擎" placement="bottom">
          <button @click="togglePhysics" class="toolbar-btn" :class="{ active: physicsEnabled }">
            <el-icon>
              <MagicStick />
            </el-icon>
          </button>
        </el-tooltip>

        <el-tooltip content="导出图片" placement="bottom">
          <button @click="exportImage" class="toolbar-btn">
            <el-icon>
              <Download />
            </el-icon>
          </button>
        </el-tooltip>
      </div>
    </div>

    <!-- 图谱信息面板 -->
    <div class="graph-info-panel" v-if="graphData.nodes && graphData.nodes.length > 0">
      <div class="info-row">
        <div class="info-item">
          <el-icon class="info-icon">
            <Connection />
          </el-icon>
          <span class="info-value">{{ visibleNodes }}</span>
          <span class="info-label">节点</span>
        </div>
        <div class="info-item">
          <el-icon class="info-icon">
            <Share />
          </el-icon>
          <span class="info-value">{{ visibleEdges }}</span>
          <span class="info-label">关系</span>
        </div>
        <div class="info-item" v-if="selectedNodeCount > 0">
          <el-icon class="info-icon"><Select /></el-icon>
          <span class="info-value">{{ selectedNodeCount }}</span>
          <span class="info-label">已选</span>
        </div>
      </div>
    </div>

    <!-- 搜索结果提示 -->
    <div class="search-results" v-if="searchedNodes.length > 0">
      <div class="search-header">
        <div class="search-title">
          <el-icon>
            <Search />
          </el-icon>
          <span>搜索结果 ({{ searchedNodes.length }})</span>
        </div>
        <button @click="clearSearch" class="clear-btn">
          <el-icon size="14">
            <Close />
          </el-icon>
        </button>
      </div>
      <div class="search-list">
        <div v-for="node in searchedNodes" :key="node.id" class="search-item" @click="focusOnNode(node.id)">
          <div class="node-info">
            <span class="node-name">{{ node.label || node.name }}</span>
            <span class="node-type">{{ getNodeTypeDisplay(node.type) }}</span>
          </div>
          <el-icon class="arrow-icon">
            <ArrowRight />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Network, DataSet } from 'vis-network/standalone'
import { useNodeConfig } from '@/composables/useNodeConfig'
import KnowledgeGraph from '@/api/knowledgeGraph'

// 导入Element Plus图标
import {
  ZoomIn,
  ZoomOut,
  FullScreen,
  Aim,
  MagicStick,
  Download,
  Close,
  Connection,
  Share,
  Select,
  Search,
  ArrowRight
} from '@element-plus/icons-vue'

export default {
  name: 'GraphVisualization',
  components: {
    ZoomIn,
    ZoomOut,
    FullScreen,
    Aim,
    MagicStick,
    Download,
    Close,
    Connection,
    Share,
    Select,
    Search,
    ArrowRight
  },
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

    // 安全的节点选择方法
    const safeSelectNodes = (nodeIds) => {
      if (!network.value) return false

      try {
        // 方法1: 直接使用 selectNodes
        network.value.selectNodes(nodeIds)
        return true
      } catch (error) {
        console.warn('selectNodes 失败，尝试替代方法:', error)

        try {
          // 方法2: 使用 setSelection
          network.value.setSelection({
            nodes: nodeIds,
            edges: []
          })
          return true
        } catch (error2) {
          console.warn('setSelection 也失败了，使用手动触发:', error2)

          // 方法3: 手动触发选择事件
          if (nodeIds.length > 0) {
            const nodeData = graphData.value.nodes.find((n) => n.id === nodeIds[0])
            if (nodeData) {
              emit('node-selected', nodeData)
              selectedNodeCount.value = nodeIds.length
            }
          } else {
            emit('node-deselected')
            selectedNodeCount.value = 0
          }
          return false
        }
      }
    }

    // 安全的清除选择方法
    const safeClearSelection = () => {
      if (!network.value) return false

      try {
        network.value.selectNodes([])
        return true
      } catch (error) {
        console.warn('清除选择失败:', error)
        try {
          network.value.setSelection({ nodes: [], edges: [] })
          return true
        } catch (error2) {
          console.warn('setSelection 清除也失败了:', error2)
          // 手动触发取消选择事件
          emit('node-deselected')
          selectedNodeCount.value = 0
          return false
        }
      }
    }

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
      const baseSize = props.graphSettings.nodeSize || 15
      const connections = node.connections || 0
      return Math.max(
        baseSize,
        Math.min(baseSize + connections * 1.5, baseSize * 2.5)
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
              background: getNodeColor(node.type) || '#A8E6CF',
              border: '#1A91C1',
              highlight: {
                background: '#1A91C1',
                border: '#0F7BA0',
              },
            },
            size: getNodeSize(node),
            font: {
              size: 12,
              color: '#333',
              face: 'Arial, sans-serif'
            },
            borderWidth: 2,
            shadow: {
              enabled: true,
              color: 'rgba(26, 145, 193, 0.2)',
              size: 8,
              x: 2,
              y: 2
            }
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
              color: edge.is_verified ? '#1A91C1' : '#A8E6CF',
              highlight: '#0F7BA0',
              opacity: edge.is_verified ? 0.8 : 0.5,
            },
            smooth: {
              type: 'continuous',
            },
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 0.8,
                type: 'arrow'
              },
            },
            font: {
              size: 10,
              color: '#666',
              strokeWidth: 2,
              strokeColor: '#F5FBFF'
            }
          }))
        )

        // 网络配置
        const options = {
          physics: {
            enabled: physicsEnabled.value,
            stabilization: {
              iterations: 200,
              updateInterval: 25
            },
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
              gravitationalConstant: -80,
              centralGravity: 0.005,
              springLength: 150,
              springConstant: 0.18,
              damping: 0.4,
              avoidOverlap: 0.5
            },
          },
          interaction: {
            hover: true,
            hoverConnectedEdges: true,
            selectConnectedEdges: false,
            tooltipDelay: 300,
            zoomView: true,
            dragView: true
          },
          nodes: {
            borderWidth: 2,
            shadow: true,
            font: {
              size: 12,
              face: 'Arial, sans-serif'
            },
            chosen: {
              node: function (values, id, selected, hovering) {
                values.shadow = true
                values.shadowSize = 12
                values.shadowColor = 'rgba(26, 145, 193, 0.4)'
              }
            }
          },
          edges: {
            shadow: false,
            smooth: {
              type: 'continuous',
              forceDirection: 'none',
              roundness: 0.1
            },
            chosen: {
              edge: function (values, id, selected, hovering) {
                values.width = values.width * 1.5
              }
            }
          },
          layout: {
            improvedLayout: true,
            clusterThreshold: 150
          }
        }

        // 销毁旧的网络实例
        if (network.value) {
          try {
            network.value.destroy()
          } catch (error) {
            console.warn('销毁旧网络实例时出错:', error)
          }
        }

        // 创建网络
        network.value = new Network(
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
        if (physicsEnabled.value) {
          network.value.setOptions({ physics: { enabled: false } })
        }
      })
    }

    // 工具栏功能
    const zoomIn = () => {
      if (network.value) {
        try {
          const scale = network.value.getScale()
          network.value.moveTo({
            scale: Math.min(scale * 1.3, 3.0),
            animation: { duration: 300, easingFunction: 'easeInOutCubic' }
          })
        } catch (error) {
          console.error('缩放操作失败:', error)
        }
      }
    }

    const zoomOut = () => {
      if (network.value) {
        try {
          const scale = network.value.getScale()
          network.value.moveTo({
            scale: Math.max(scale * 0.7, 0.1),
            animation: { duration: 300, easingFunction: 'easeInOutCubic' }
          })
        } catch (error) {
          console.error('缩放操作失败:', error)
        }
      }
    }

    const resetZoom = () => {
      if (network.value) {
        try {
          network.value.fit({
            animation: {
              duration: 800,
              easingFunction: 'easeInOutQuart',
            },
          })
        } catch (error) {
          console.error('重置缩放失败:', error)
        }
      }
    }

    const centerGraph = () => {
      if (network.value) {
        try {
          const nodeIds = network.value.getSelectedNodes()
          if (nodeIds.length > 0) {
            network.value.focus(nodeIds[0], {
              scale: 1.2,
              animation: {
                duration: 800,
                easingFunction: 'easeInOutQuart',
              },
            })
          } else {
            network.value.fit({
              animation: {
                duration: 800,
                easingFunction: 'easeInOutQuart',
              },
            })
          }
        } catch (error) {
          console.error('居中操作失败:', error)
        }
      }
    }

    const togglePhysics = () => {
      physicsEnabled.value = !physicsEnabled.value
      if (network.value) {
        try {
          network.value.setOptions({
            physics: { enabled: physicsEnabled.value },
          })
        } catch (error) {
          console.error('切换物理引擎失败:', error)
        }
      }
    }

    const exportImage = () => {
      if (network.value) {
        try {
          const canvas = network.value.canvas.frame.canvas
          const link = document.createElement('a')
          link.download = `LiverScholar-knowledge-graph-${Date.now()}.png`
          link.href = canvas.toDataURL('image/png', 1.0)
          link.click()
        } catch (error) {
          console.error('导出图片失败:', error)
        }
      }
    }

    // 搜索功能 - 使用安全的选择方法
    const searchNodes = (keyword) => {
      if (!keyword || !graphData.value.nodes) {
        searchedNodes.value = []
        safeClearSelection()
        return
      }

      const results = graphData.value.nodes.filter(
        (node) =>
          (node.name || node.label || '')
            .toLowerCase()
            .includes(keyword.toLowerCase()) ||
          (node.description || '').toLowerCase().includes(keyword.toLowerCase())
      )

      searchedNodes.value = results.slice(0, 10) // 限制显示数量

      if (network.value && results.length > 0) {
        const nodeIds = results.map((node) => node.id)
        const success = safeSelectNodes(nodeIds)

        if (success && results.length === 1) {
          // 延迟聚焦以确保选择完成
          setTimeout(() => {
            focusOnNode(results[0].id)
          }, 100)
        } else if (!success && results.length === 1) {
          // 如果选择失败，直接聚焦
          focusOnNode(results[0].id)
        }
      }
    }

    // 清除搜索 - 使用安全的清除方法
    const clearSearch = () => {
      searchedNodes.value = []
      safeClearSelection()
    }

    // 聚焦到指定节点 - 修复版本
    const focusOnNode = (nodeId) => {
      if (!network.value) return

      try {
        // 先聚焦到节点
        network.value.focus(nodeId, {
          scale: 1.5,
          animation: {
            duration: 800,
            easingFunction: 'easeInOutQuart',
          },
        })

        // 延迟选择节点以避免并发问题
        setTimeout(() => {
          const success = safeSelectNodes([nodeId])
          if (!success) {
            // 如果选择失败，手动触发选择事件
            const nodeData = graphData.value.nodes.find((n) => n.id === nodeId)
            if (nodeData) {
              emit('node-selected', nodeData)
              selectedNodeCount.value = 1
            }
          }
        }, 200)
      } catch (error) {
        console.error('聚焦节点失败:', error)
        // 即使聚焦失败，也尝试触发选择事件
        const nodeData = graphData.value.nodes.find((n) => n.id === nodeId)
        if (nodeData) {
          emit('node-selected', nodeData)
          selectedNodeCount.value = 1
        }
      }
    }

    // 重新加载数据 - 暴露给父组件调用
    const reloadData = () => {
      loadGraphData()
    }

    // 监听器
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
        try {
          network.value.destroy()
        } catch (error) {
          console.warn('销毁网络实例时出错:', error)
        }
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
  background: #F5FBFF;
  border: 2px solid #A8E6CF;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(26, 145, 193, 0.1);
}

.graph-canvas {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #F5FBFF 0%, rgba(168, 230, 207, 0.1) 100%);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(245, 251, 255, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(168, 230, 207, 0.3);
  border-top: 4px solid #1A91C1;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

.loading-text {
  color: #1A91C1;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
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
  top: 20px;
  right: 20px;
  z-index: 100;
}

.toolbar-group {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 6px 24px rgba(26, 145, 193, 0.15);
  border: 1px solid rgba(168, 230, 207, 0.3);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #1A91C1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 2px;
}

.toolbar-btn:hover {
  background: rgba(26, 145, 193, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 145, 193, 0.2);
}

.toolbar-btn.active {
  background: #1A91C1;
  color: white;
  box-shadow: 0 4px 12px rgba(26, 145, 193, 0.3);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(168, 230, 207, 0.5);
  margin: 0 8px;
}

.graph-info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(26, 145, 193, 0.15);
  border: 1px solid rgba(168, 230, 207, 0.3);
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

.info-icon {
  color: #1A91C1;
  font-size: 16px;
}

.info-value {
  font-weight: 600;
  font-size: 16px;
  color: #1A91C1;
}

.info-label {
  color: #666;
  font-size: 14px;
}

.search-results {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  max-height: 400px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(26, 145, 193, 0.2);
  border: 1px solid rgba(168, 230, 207, 0.4);
  z-index: 100;
  overflow: hidden;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1A91C1, #0F7BA0);
  color: white;
}

.search-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 15px;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.search-list {
  max-height: 320px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(168, 230, 207, 0.2);
  transition: all 0.2s;
}

.search-item:hover {
  background: rgba(26, 145, 193, 0.05);
  transform: translateX(4px);
}

.search-item:last-child {
  border-bottom: none;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.node-type {
  font-size: 12px;
  color: #1A91C1;
  background: rgba(168, 230, 207, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.arrow-icon {
  color: #A8E6CF;
  font-size: 16px;
  transition: all 0.2s;
}

.search-item:hover .arrow-icon {
  color: #1A91C1;
  transform: translateX(2px);
}

/* 自定义滚动条 */
.search-list::-webkit-scrollbar {
  width: 6px;
}

.search-list::-webkit-scrollbar-track {
  background: rgba(168, 230, 207, 0.1);
}

.search-list::-webkit-scrollbar-thumb {
  background: rgba(26, 145, 193, 0.3);
  border-radius: 3px;
}

.search-list::-webkit-scrollbar-thumb:hover {
  background: rgba(26, 145, 193, 0.5);
}
</style>