<template>
  <div class="graph-visualization" ref="graphContainer">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">加载知识图谱中...</p>
    </div>

    <!-- 背景网格 -->
    <div class="background-grid">
      <svg class="grid-svg" width="100%" height="100%" viewBox="0 0 800 800">
        <!-- 同心圆 -->
        <circle cx="400" cy="400" r="50" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="130" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="200" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="270" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="340" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />

        <!-- 扇形分割线 -->
        <line x1="400" y1="400" x2="400" y2="60" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="694.6" y2="230" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="694.6" y2="570" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="400" y2="740" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="105.4" y2="570" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <line x1="400" y1="400" x2="105.4" y2="230" stroke="#ddd" stroke-width="2" opacity="0.8" />
      </svg>
    </div>

    <!-- 图谱画布 -->
    <div class="graph-canvas" ref="networkContainer"></div>

    <!-- 图谱工具栏 -->
    <div class="graph-toolbar" v-if="!taskId || taskId === 0">
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

    <!-- 图谱信息面板 -->
    <div class="graph-info-panel" v-if="(!taskId || taskId === 0) && graphDataComputed.nodes?.length > 0">
      <div class="info-row">
        <div class="info-item">
          <span class="info-value">{{ visibleNodes }}</span>
          <span class="info-label">实体</span>
        </div>
        <div class="info-item">
          <span class="info-value">{{ visibleEdges }}</span>
          <span class="info-label">关系</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Network, DataSet } from 'vis-network/standalone'
import KnowledgeGraph from '@/api/knowledgeGraph'
import Literature from '@/api/Literature'
import { ZoomIn, ZoomOut, FullScreen, Aim, MagicStick } from '@element-plus/icons-vue'

export default {
  name: 'GraphVisualization',
  components: { ZoomIn, ZoomOut, FullScreen, Aim, MagicStick },
  props: {
    currentView: { type: String, default: 'concept' },
    graphData: { type: Object, default: () => ({ nodes: [], edges: [] }) },
    graphSettings: { type: Object, required: true },
    selectedFilters: { type: Object, default: () => ({}) },
    isLoading: { type: Boolean, default: false },
    taskId: { type: [Number, String], default: null }
  },
  emits: ['entity-selected', 'entity-deselected'],
  setup(props, { emit }) {
    const networkContainer = ref(null)
    const network = ref(null)
    const internalGraphData = ref({ nodes: [], edges: [] })
    const physicsEnabled = ref(false)

    // 层级配置 - 恢复原始颜色
    const levelConfig = [
      { level: 1, name: '疾病状态', color: '#FF6B6B', radius: 30 },
      { level: 2, name: '免疫细胞', color: '#4ECDC4', radius: 130 },
      { level: 3, name: '病原体', color: '#45B7D1', radius: 200 }
    ]

    const graphDataComputed = computed(() => internalGraphData.value)
    const visibleNodes = computed(() => graphDataComputed.value.nodes?.length || 0)
    const visibleEdges = computed(() => graphDataComputed.value.edges?.length || 0)

    // 获取层级配置
    const getLevelConfig = (level) => {
      return levelConfig.find(config => config.level === level) || levelConfig[2]
    }

    // 获取实体大小
    const getEntitySize = (entity) => {
      const baseSize = props.graphSettings.nodeSize || 20
      switch (entity.level) {
        case 1: return baseSize * 2
        case 2: return baseSize * 1.3
        case 3: return baseSize
        default: return baseSize
      }
    }

    // 计算优化的布局
    const calculateOptimizedLayout = (entities) => {
      const layout = {}
      const levelGroups = {}

      // 按层级分组
      entities.forEach(entity => {
        if (!levelGroups[entity.level]) levelGroups[entity.level] = []
        levelGroups[entity.level].push(entity)
      })

      // Level 1: 中心位置
      if (levelGroups[1]) {
        levelGroups[1].forEach((entity, index) => {
          if (levelGroups[1].length === 1) {
            layout[entity.name] = { x: 0, y: 0 }
          } else {
            const angle = (index * 2 * Math.PI) / levelGroups[1].length
            const radius = 15
            layout[entity.name] = {
              x: radius * Math.cos(angle),
              y: radius * Math.sin(angle)
            }
          }
        })
      }

      // Level 2: 对称的六扇形分布
      if (levelGroups[2]) {
        const baseRadius = 130
        const sectorCount = 6
        const sectorAngle = (2 * Math.PI) / sectorCount

        levelGroups[2].forEach((entity, index) => {
          const sectorIndex = index % sectorCount
          const layerIndex = Math.floor(index / sectorCount)

          // 扇形中心角度
          const sectorCenterAngle = sectorIndex * sectorAngle

          // 多层分布，每层半径递增
          const currentRadius = baseRadius + layerIndex * 25

          // 在扇形内的角度偏移
          const maxInSector = Math.ceil(levelGroups[2].length / sectorCount)
          const posInSector = Math.floor(index / sectorCount)
          const angleOffset = maxInSector > 1 ?
            (sectorAngle * 0.6) * (posInSector / (maxInSector - 1) - 0.5) : 0

          const finalAngle = sectorCenterAngle + angleOffset

          layout[entity.name] = {
            x: currentRadius * Math.cos(finalAngle),
            y: currentRadius * Math.sin(finalAngle)
          }
        })
      }

      // Level 3: 多圆环分布，每圆环10-15个节点
      if (levelGroups[3]) {
        const nodesPerRing = 12 // 每圆环12个节点
        const startRadius = 200
        const ringSpacing = 35

        levelGroups[3].forEach((entity, index) => {
          const ringIndex = Math.floor(index / nodesPerRing)
          const posInRing = index % nodesPerRing

          const currentRadius = startRadius + ringIndex * ringSpacing
          const angleStep = (2 * Math.PI) / nodesPerRing
          const angle = posInRing * angleStep

          layout[entity.name] = {
            x: currentRadius * Math.cos(angle),
            y: currentRadius * Math.sin(angle)
          }
        })
      }

      return layout
    }

    // 加载数据
    const loadGraphData = async () => {
      if (props.taskId && props.taskId !== 0) {
        try {
          const response = await Literature.getAnalyzeDetail(props.taskId)
          if (response.data.data) {
            internalGraphData.value = {
              nodes: response.data.data.nodes || [],
              edges: response.data.data.edges || [],
            }
            await nextTick()
            initializeNetwork()
          }
        } catch (error) {
          console.error('加载任务数据失败:', error)
        }
      } else {
        try {
          const params = {
            verified_only: false,
            limit: 500,
          }
          if (props.selectedFilters.selectedEntityTypes?.length > 0) {
            params.entity_type = props.selectedFilters.selectedEntityTypes.join(',')
          }
          const response = await KnowledgeGraph.getGraph(params)
          if (response.data.data) {
            internalGraphData.value = {
              nodes: response.data.data.nodes || [],
              edges: response.data.data.edges || [],
            }
            await nextTick()
            initializeNetwork()
          }
        } catch (error) {
          console.error('加载图谱数据失败:', error)
        }
      }
    }

    // 初始化网络图
    const initializeNetwork = async () => {
      if (!networkContainer.value || !graphDataComputed.value.nodes.length) return

      try {
        const layout = calculateOptimizedLayout(graphDataComputed.value.nodes)

        // 处理节点数据
        const nodes = new DataSet(
          graphDataComputed.value.nodes.map((entity) => {
            const levelConfig = getLevelConfig(entity.level)
            const position = layout[entity.name] || { x: 0, y: 0 }

            return {
              id: entity.name,
              label: props.graphSettings.showLabels ? entity.name : '',
              title: `${entity.name}\n层级: Level ${entity.level}\n类型: ${entity.entity_type || '未分类'}`,
              x: position.x,
              y: position.y,
              color: {
                background: levelConfig.color,
                border: '#ffffff',
                highlight: { background: levelConfig.color, border: '#333333' },
              },
              size: getEntitySize(entity),
              font: { size: entity.level === 1 ? 16 : 14, color: '#333' },
              borderWidth: entity.level === 1 ? 3 : 2,
              shadow: true
            }
          })
        )

        // 处理边数据
        const edges = new DataSet(
          (graphDataComputed.value.edges || []).map((edge, index) => ({
            id: `edge-${index}`,
            from: edge.source_entity.name,
            to: edge.target_entity.name,
            label: edge.factor?.factor_name || '',
            width: props.graphSettings.edgeWidth || 2,
            color: { color: '#888888', highlight: '#333333', opacity: 0.6 },
            smooth: { type: 'curvedCW', roundness: 0.2 },
            arrows: { to: { enabled: true, scaleFactor: 1.2 } },
            font: { size: 10, color: '#555' }
          }))
        )

        // 网络配置
        const options = {
          physics: { enabled: false },
          interaction: {
            hover: true,
            hoverConnectedEdges: true,
            selectConnectedEdges: false,
            tooltipDelay: 300,
            zoomView: true,
            dragView: true,
            dragNodes: true
          },
          nodes: {
            borderWidth: 2,
            shadow: true,
            font: { face: 'Arial, sans-serif' }
          },
          edges: {
            shadow: false,
            smooth: { type: 'curvedCW', roundness: 0.15 },
            length: 120
          },
          layout: {
            hierarchical: false,
            randomSeed: 42
          }
        }

        // 销毁旧实例
        if (network.value) {
          try {
            network.value.destroy()
          } catch (error) {
            console.warn('销毁旧网络实例时出错:', error)
          }
        }

        // 创建网络
        network.value = new Network(networkContainer.value, { nodes, edges }, options)
        setupEventListeners()

        // 自动适应画面
        setTimeout(resetZoom, 100)

      } catch (error) {
        console.error('初始化网络图失败:', error)
      }
    }

    // 设置事件监听器
    const setupEventListeners = () => {
      if (!network.value) return

      network.value.on('selectNode', (params) => {
        if (params.nodes.length > 0) {
          const entityId = params.nodes[0]
          const entityData = graphDataComputed.value.nodes.find((n) => n.name === entityId)
          if (entityData) emit('entity-selected', entityData)
        }
      })

      network.value.on('deselectNode', () => {
        emit('entity-deselected')
      })

      network.value.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          focusOnEntity(params.nodes[0])
        }
      })
    }

    // 工具栏功能
    const zoomIn = () => {
      if (network.value) {
        const scale = network.value.getScale()
        network.value.moveTo({
          scale: Math.min(scale * 1.3, 3.0),
          animation: { duration: 300 }
        })
      }
    }

    const zoomOut = () => {
      if (network.value) {
        const scale = network.value.getScale()
        network.value.moveTo({
          scale: Math.max(scale * 0.7, 0.1),
          animation: { duration: 300 }
        })
      }
    }

    const resetZoom = () => {
      if (network.value) {
        network.value.fit({ animation: { duration: 800 } })
      }
    }

    const centerGraph = () => {
      if (network.value) {
        try {
          const selectedNodes = network.value.getSelectedNodes()
          if (selectedNodes.length > 0) {
            network.value.focus(selectedNodes[0], {
              scale: 1.2,
              animation: { duration: 800 }
            })
          } else {
            resetZoom()
          }
        } catch (error) {
          resetZoom()
        }
      }
    }

    const togglePhysics = () => {
      physicsEnabled.value = !physicsEnabled.value
      if (network.value) {
        network.value.setOptions({ physics: { enabled: physicsEnabled.value } })
      }
    }

    const focusOnEntity = (entityId) => {
      if (network.value) {
        try {
          network.value.focus(entityId, {
            scale: 1.5,
            animation: { duration: 800 }
          })
          setTimeout(() => {
            network.value.selectNodes([entityId])
          }, 850)
        } catch (error) {
          console.error('聚焦实体失败:', error)
        }
      }
    }

    // 监听器
    watch(() => props.selectedFilters, () => {
      if (!props.taskId || props.taskId === 0) {
        loadGraphData()
      }
    }, { deep: true })

    watch(() => props.graphSettings, () => {
      if (network.value) initializeNetwork()
    }, { deep: true })

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

    return {
      networkContainer,
      visibleNodes,
      visibleEdges,
      graphDataComputed,
      physicsEnabled,
      zoomIn,
      zoomOut,
      resetZoom,
      centerGraph,
      togglePhysics,
      focusOnEntity
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