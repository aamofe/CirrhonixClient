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
        <!-- 同心圆 - 增加更多圆圈 -->
        <circle cx="400" cy="400" r="50" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="130" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="200" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="270" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="340" fill="none" stroke="#ddd" stroke-width="2" opacity="0.8" />
        <circle cx="400" cy="400" r="410" fill="none" stroke="#ddd" stroke-width="1" opacity="0.8" />
        <circle cx="400" cy="400" r="480" fill="none" stroke="#ddd" stroke-width="1" opacity="0.8" />

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

    <!-- 工具栏物理引擎按钮 -->
    <div class="graph-toolbar" v-if="!taskId || taskId === 0">
      <div class="toolbar-group">
        <button @click="toggleToolbarPhysics" class="toolbar-btn" :class="{ active: toolbarPhysicsEnabled }"
          title="工具栏物理引擎">
          <el-icon>
            <MagicStick />
          </el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Network, DataSet } from 'vis-network/standalone'
import KnowledgeGraph from '@/api/knowledgeGraph'
import Literature from '@/api/Literature'
import { MagicStick } from '@element-plus/icons-vue'

export default {
  name: 'GraphVisualization',
  components: { MagicStick },
  props: {
    currentView: { type: String, default: 'concept' },
    graphData: { type: Object, default: () => ({ nodes: [], edges: [] }) },
    graphSettings: { type: Object, required: true },
    searchKeyword: { type: String, default: '' },
    isLoading: { type: Boolean, default: false },
    taskId: { type: [Number, String], default: null }
  },
  emits: [
    'entity-selected',
    'entity-deselected',
    'zoom-in-complete',
    'zoom-out-complete',
    'reset-zoom-complete',
    'center-graph-complete'
  ],
  setup(props, { emit, expose }) {
    const networkContainer = ref(null)
    const network = ref(null)
    const internalGraphData = ref({ nodes: [], edges: [] })
    const toolbarPhysicsEnabled = ref(false)
    const highlightedNodes = ref([])

    const levelConfig = [
      { level: 1, name: '疾病状态', color: '#FF6B6B', radius: 30 },
      { level: 2, name: '免疫细胞', color: '#4ECDC4', radius: 130 },
      { level: 3, name: '病原体', color: '#45B7D1', radius: 200 }
    ]

    const graphDataComputed = computed(() => internalGraphData.value)

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

    // 计算优化的布局 - 避免重合，Level 3更散更整齐
    const calculateOptimizedLayout = (entities) => {
      const layout = {}
      const levelGroups = {}

      // 按层级分组
      entities.forEach(entity => {
        if (!levelGroups[entity.level]) levelGroups[entity.level] = []
        levelGroups[entity.level].push(entity)
      })

      // Level 1: 中心区域 - 松散分布
      if (levelGroups[1]) {
        const nodes = levelGroups[1]

        if (nodes.length === 1) {
          layout[nodes[0].name] = { x: 0, y: 0 }
        } else if (nodes.length === 2) {
          // 两个节点水平分布
          layout[nodes[0].name] = { x: -40, y: 0 }
          layout[nodes[1].name] = { x: 40, y: 0 }
        } else {
          // 多个节点圆形分布，增大半径
          const radius = Math.max(50, nodes.length * 12)
          nodes.forEach((entity, index) => {
            const angle = (index * 2 * Math.PI) / nodes.length
            layout[entity.name] = {
              x: radius * Math.cos(angle),
              y: radius * Math.sin(angle)
            }
          })
        }
      }

      // Level 2: 中间层 - 更松散的圆环分布
      if (levelGroups[2]) {
        const nodes = levelGroups[2]
        const baseRadius = 180  // 增大基础半径
        const minAngle = Math.PI / 8  // 最小角度间距 (22.5度)

        // 计算每环最大节点数
        const maxNodesPerRing = Math.floor((2 * Math.PI) / minAngle)
        const ringCount = Math.ceil(nodes.length / maxNodesPerRing)

        let nodeIndex = 0
        for (let ring = 0; ring < ringCount; ring++) {
          const nodesInRing = Math.min(maxNodesPerRing, nodes.length - nodeIndex)
          const currentRadius = baseRadius + ring * 60  // 环间距60px

          // 为每环添加随机角度偏移，避免对齐
          const angleOffset = ring * (Math.PI / 6) + Math.random() * (Math.PI / 12)

          for (let i = 0; i < nodesInRing; i++) {
            const entity = nodes[nodeIndex + i]
            const angle = (i * 2 * Math.PI) / nodesInRing + angleOffset

            // 添加小幅随机偏移，增加自然感
            const radiusJitter = (Math.random() - 0.5) * 20
            const angleJitter = (Math.random() - 0.5) * (Math.PI / 16)

            const finalRadius = currentRadius + radiusJitter
            const finalAngle = angle + angleJitter

            layout[entity.name] = {
              x: finalRadius * Math.cos(finalAngle),
              y: finalRadius * Math.sin(finalAngle)
            }
          }

          nodeIndex += nodesInRing
        }
      }

      // Level 3: 外层 - 超松散的多环螺旋分布
      if (levelGroups[3]) {
        const nodes = levelGroups[3]
        const startRadius = 320  // 增大起始半径
        const ringSpacing = 70   // 增大环间距
        const minNodeDistance = 50  // 增大最小节点间距

        // 动态计算每环节点数
        const calculateOptimalNodesPerRing = (radius) => {
          const circumference = 2 * Math.PI * radius
          const optimalNodes = Math.floor(circumference / minNodeDistance)
          return Math.max(6, Math.min(optimalNodes, 16)) // 限制范围 6-16
        }

        let remainingNodes = nodes.length
        let currentIndex = 0
        let ringIndex = 0

        while (remainingNodes > 0) {
          const currentRadius = startRadius + ringIndex * ringSpacing
          const maxNodesThisRing = calculateOptimalNodesPerRing(currentRadius)
          const nodesThisRing = Math.min(remainingNodes, maxNodesThisRing)

          // 每环随机起始角度
          const baseAngle = Math.random() * Math.PI

          for (let i = 0; i < nodesThisRing; i++) {
            const entity = nodes[currentIndex + i]
            const angle = baseAngle + (i * 2 * Math.PI) / nodesThisRing

            // 增加更大的随机偏移
            const radiusJitter = (Math.random() - 0.5) * 30
            const angleJitter = (Math.random() - 0.5) * (Math.PI / 12)

            const finalRadius = currentRadius + radiusJitter
            const finalAngle = angle + angleJitter

            layout[entity.name] = {
              x: finalRadius * Math.cos(finalAngle),
              y: finalRadius * Math.sin(finalAngle)
            }
          }

          currentIndex += nodesThisRing
          remainingNodes -= nodesThisRing
          ringIndex++
        }
      }

      return layout
    }

    // 简化的冲突检测和解决
    const resolveLayoutConflicts = (layout) => {
      const positions = Object.entries(layout)
      const minDistance = 35 // 最小安全距离
      const resolved = { ...layout }

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const [name1, pos1] = positions[i]
          const [name2, pos2] = positions[j]

          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < minDistance && distance > 0) {
            // 计算推开向量
            const pushDistance = (minDistance - distance) / 2
            const pushX = (dx / distance) * pushDistance
            const pushY = (dy / distance) * pushDistance

            resolved[name1] = {
              x: pos1.x - pushX,
              y: pos1.y - pushY
            }
            resolved[name2] = {
              x: pos2.x + pushX,
              y: pos2.y + pushY
            }
          }
        }
      }

      return resolved
    }

    // 主布局函数 - 简洁版本
    const calculateFinalLayout = (entities) => {
      const initialLayout = calculateOptimizedLayout(entities)
      const finalLayout = resolveLayoutConflicts(initialLayout)

      console.log(`布局计算完成，处理了 ${entities.length} 个节点`)

      return finalLayout
    }

    // 搜索功能
    const handleSearch = (keyword) => {
      if (!network.value) return

      // 清除之前的高亮
      clearHighlight()

      if (!keyword.trim()) {
        return
      }

      // 查找匹配的节点
      const matchingNodes = graphDataComputed.value.nodes.filter(node =>
        node.name.toLowerCase().includes(keyword.toLowerCase())
      )

      if (matchingNodes.length > 0) {
        // 高亮匹配的节点
        const nodeIds = matchingNodes.map(node => node.name)
        highlightedNodes.value = nodeIds

        // 更新节点样式
        const nodes = network.value.body.data.nodes
        const updates = matchingNodes.map(node => ({
          id: node.name,
          color: {
            background: '#FFD700', // 金黄色高亮
            border: '#FF6B00',
            highlight: { background: '#FFD700', border: '#FF6B00' }
          },
          borderWidth: 4
        }))

        nodes.update(updates)

        // 如果只有一个匹配节点，聚焦到它
        if (matchingNodes.length === 1) {
          focusOnEntity(matchingNodes[0].name)
        } else {
          // 多个匹配节点时，适应视图显示所有匹配节点
          network.value.selectNodes(nodeIds)
          network.value.focus(nodeIds[0], {
            scale: 1.0,
            animation: { duration: 800 }
          })
        }

        console.log(`找到 ${matchingNodes.length} 个匹配节点:`, nodeIds)
      } else {
        console.log('未找到匹配的节点')
      }
    }

    // 清除高亮
    const clearHighlight = () => {
      if (!network.value || highlightedNodes.value.length === 0) return

      const nodes = network.value.body.data.nodes
      const updates = highlightedNodes.value.map(nodeId => {
        const originalNode = graphDataComputed.value.nodes.find(n => n.name === nodeId)
        if (originalNode) {
          const levelConfig = getLevelConfig(originalNode.level)
          return {
            id: nodeId,
            color: {
              background: levelConfig.color,
              border: '#ffffff',
              highlight: { background: levelConfig.color, border: '#333333' }
            },
            borderWidth: originalNode.level === 1 ? 3 : 2
          }
        }
        return null
      }).filter(Boolean)

      nodes.update(updates)
      highlightedNodes.value = []
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
        const layout = calculateFinalLayout(graphDataComputed.value.nodes)

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
        const optimizedNetworkOptions = {
          physics: { enabled: false },
          interaction: {
            hover: true,
            hoverConnectedEdges: true,
            selectConnectedEdges: false,
            tooltipDelay: 200,
            zoomView: true,
            dragView: true,
            dragNodes: true
          },
          nodes: {
            borderWidth: 2,
            shadow: true,
            font: {
              face: 'Arial, sans-serif',
              color: '#333'
            }
          },
          edges: {
            shadow: false,
            smooth: {
              type: 'curvedCW',
              roundness: 0.15
            },
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
        network.value = new Network(networkContainer.value, { nodes, edges }, optimizedNetworkOptions)
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

    // 工具栏操作方法
    const zoomIn = () => {
      if (network.value) {
        const scale = network.value.getScale()
        network.value.moveTo({
          scale: Math.min(scale * 1.3, 3.0),
          animation: { duration: 300 }
        })
        emit('zoom-in-complete')
      }
    }

    const zoomOut = () => {
      if (network.value) {
        const scale = network.value.getScale()
        network.value.moveTo({
          scale: Math.max(scale * 0.7, 0.1),
          animation: { duration: 300 }
        })
        emit('zoom-out-complete')
      }
    }

    const resetZoom = () => {
      if (network.value) {
        network.value.fit({ animation: { duration: 800 } })
        emit('reset-zoom-complete')
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
          emit('center-graph-complete')
        } catch (error) {
          resetZoom()
          emit('center-graph-complete')
        }
      }
    }

    const toggleToolbarPhysics = () => {
      toolbarPhysicsEnabled.value = !toolbarPhysicsEnabled.value
      if (network.value) {
        network.value.setOptions({ physics: { enabled: toolbarPhysicsEnabled.value } })
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
    watch(() => props.searchKeyword, (newKeyword) => {
      handleSearch(newKeyword)
    })

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

    // 暴露给父组件的方法
    expose({
      zoomIn,
      zoomOut,
      resetZoom,
      centerGraph,
      focusOnEntity,
      handleSearch
    })

    return {
      networkContainer,
      graphDataComputed,
      toolbarPhysicsEnabled,
      zoomIn,
      zoomOut,
      resetZoom,
      centerGraph,
      toggleToolbarPhysics,
      focusOnEntity,
      handleSearch
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

@media (max-width: 768px) {
  .graph-toolbar {
    top: 10px;
    right: 10px;
  }
}
</style>