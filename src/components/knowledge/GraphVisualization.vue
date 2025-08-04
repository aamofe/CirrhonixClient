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

    // 层级配置 - 调整半径以适应新的分散分布
    const levelConfig = [
      { level: 1, name: '疾病状态', color: '#FF6B6B', radius: 30 },
      { level: 2, name: '免疫细胞', color: '#4ECDC4', radius: 160 },
      { level: 3, name: '病原体', color: '#45B7D1', radius: 500 }
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

    // 计算美化的扇形分布布局
    const calculateCircularLayout = (entities) => {
      const layout = {}
      const levelGroups = {}

      // 按层级分组
      entities.forEach(entity => {
        if (!levelGroups[entity.level]) levelGroups[entity.level] = []
        levelGroups[entity.level].push(entity)
      })

      console.log('Level groups:', {
        level1: levelGroups[1]?.length || 0,
        level2: levelGroups[2]?.length || 0,
        level3: levelGroups[3]?.length || 0
      })

      // Level 1: 中心区域
      if (levelGroups[1]) {
        levelGroups[1].forEach((entity, index) => {
          if (levelGroups[1].length === 1) {
            layout[entity.name] = { x: 0, y: 0 }
          } else {
            const angle = (index * 2 * Math.PI) / levelGroups[1].length
            const radius = Math.random() * 20 + 5
            layout[entity.name] = {
              x: radius * Math.cos(angle),
              y: radius * Math.sin(angle)
            }
          }
        })
      }

      // Level 2: 圆环区域，严格6扇形分布
      if (levelGroups[2]) {
        const innerRadius = 100
        const outerRadius = 160
        const sectorCount = 6
        const sectorAngle = (2 * Math.PI) / sectorCount // 60度每个扇形

        // 将节点分配到6个扇形中
        const sectorsDistribution = Array(sectorCount).fill(0).map(() => [])
        levelGroups[2].forEach((entity, index) => {
          const sectorIndex = index % sectorCount
          sectorsDistribution[sectorIndex].push(entity)
        })

        sectorsDistribution.forEach((sectorEntities, sectorIndex) => {
          const sectorStartAngle = sectorIndex * sectorAngle
          const sectorCenterAngle = sectorStartAngle + sectorAngle / 2

          sectorEntities.forEach((entity, indexInSector) => {
            // 在扇形内分布：如果只有1个节点放中心，多个节点则均匀分布
            let angleInSector
            if (sectorEntities.length === 1) {
              angleInSector = sectorCenterAngle
            } else {
              // 在扇形的70%范围内均匀分布
              const spreadAngle = sectorAngle * 0.7
              const startSpread = sectorCenterAngle - spreadAngle / 2
              angleInSector = startSpread + (indexInSector * spreadAngle) / (sectorEntities.length - 1)
            }

            // 半径在圆环内随机分布
            const radiusRatio = 0.2 + Math.random() * 0.8
            const radius = innerRadius + (outerRadius - innerRadius) * radiusRatio

            layout[entity.name] = {
              x: radius * Math.cos(angleInSector),
              y: radius * Math.sin(angleInSector)
            }
          })
        })
      }

      // Level 3: 最外层，6扇形分布，大幅分散
      if (levelGroups[3]) {
        const minRadius = 220
        const maxRadius = 500
        const sectorCount = 6
        const sectorAngle = (2 * Math.PI) / sectorCount

        // 将节点分配到6个扇形中
        const sectorsDistribution = Array(sectorCount).fill(0).map(() => [])
        levelGroups[3].forEach((entity, index) => {
          const sectorIndex = index % sectorCount
          sectorsDistribution[sectorIndex].push(entity)
        })

        sectorsDistribution.forEach((sectorEntities, sectorIndex) => {
          const sectorStartAngle = sectorIndex * sectorAngle

          sectorEntities.forEach((entity, indexInSector) => {
            // 在扇形内更加随机和分散的分布
            const angleSpread = sectorAngle * 0.85 // 使用85%的扇形空间
            const baseAngleInSector = sectorStartAngle + angleSpread * 0.1 + // 10%边距
              (indexInSector / Math.max(1, sectorEntities.length - 1)) * angleSpread * 0.8 // 80%分布空间

            // 添加角度随机偏移
            const angleRandomOffset = (Math.random() - 0.5) * sectorAngle * 0.3
            const finalAngle = baseAngleInSector + angleRandomOffset

            // 半径大幅变化，让节点充分分散
            const baseRadiusRatio = 0.3 + Math.random() * 0.7
            const baseRadius = minRadius + (maxRadius - minRadius) * baseRadiusRatio

            // 添加大幅径向偏移
            const radiusRandomOffset = (Math.random() - 0.5) * 120
            const finalRadius = Math.max(minRadius, Math.min(maxRadius, baseRadius + radiusRandomOffset))

            layout[entity.name] = {
              x: finalRadius * Math.cos(finalAngle),
              y: finalRadius * Math.sin(finalAngle)
            }
          })
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
        const layout = calculateCircularLayout(graphDataComputed.value.nodes)

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

        // 网络配置 - 增大画布以适应更大的分布范围
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
            font: { size: 14, face: 'Arial, sans-serif' }
          },
          edges: {
            shadow: false,
            smooth: { type: 'curvedCW', roundness: 0.15 }, // 稍微调整边的弯曲度
            length: 120 // 增加边的默认长度
          },
          layout: {
            hierarchical: false,
            randomSeed: 42 // 固定随机种子让布局更稳定
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
  height: 1400px;
  /* 进一步增加高度以适应更分散的节点分布 */
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.graph-canvas {
  width: 100%;
  height: 100%;
  background: transparent;
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
    top: 8px;
    right: 8px;
    padding: 6px;
  }

  .toolbar-btn {
    width: 32px;
    height: 32px;
  }

  .graph-info-panel {
    bottom: 8px;
    left: 8px;
    padding: 8px 12px;
  }
}
</style>