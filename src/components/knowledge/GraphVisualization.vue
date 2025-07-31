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

    <!-- 图谱工具栏 - 仅在非taskId模式或有复杂需求时显示 -->
    <div class="graph-toolbar" v-if="showComplexFeatures">
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

    <!-- 图谱信息面板 - 仅在有复杂需求时显示 -->
    <div class="graph-info-panel"
      v-if="showComplexFeatures && graphDataComputed.nodes && graphDataComputed.nodes.length > 0">
      <div class="info-row">
        <div class="info-item">
          <el-icon class="info-icon">
            <Connection />
          </el-icon>
          <span class="info-value">{{ visibleNodes }}</span>
          <span class="info-label">实体</span>
        </div>
        <div class="info-item">
          <el-icon class="info-icon">
            <Share />
          </el-icon>
          <span class="info-value">{{ visibleEdges }}</span>
          <span class="info-label">关系</span>
        </div>
        <div class="info-item" v-if="selectedEntityCount > 0">
          <el-icon class="info-icon"><Select /></el-icon>
          <span class="info-value">{{ selectedEntityCount }}</span>
          <span class="info-label">已选</span>
        </div>
      </div>
    </div>

    <!-- 搜索结果提示 - 仅在有复杂需求时显示 -->
    <div class="search-results"
      v-if="showComplexFeatures && searchedEntities && Array.isArray(searchedEntities) && searchedEntities.length > 0">
      <div class="search-header">
        <div class="search-title">
          <el-icon>
            <Search />
          </el-icon>
          <span>搜索结果 ({{ searchedEntities.length }})</span>
        </div>
        <button @click="clearSearch" class="clear-btn">
          <el-icon size="14">
            <Close />
          </el-icon>
        </button>
      </div>
      <div class="search-list">
        <div v-for="entity in searchedEntities" :key="entity.id" class="search-item" @click="focusOnEntity(entity.id)">
          <div class="entity-info">
            <span class="entity-name">{{ entity.name || '未命名实体' }}</span>
            <span class="entity-level">Level {{ entity.level }}</span>
          </div>
          <el-icon class="arrow-icon">
            <ArrowRight />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 层级图例 -->
    <div class="level-legend" v-if="showComplexFeatures">
      <div class="legend-title">层级图例</div>
      <div class="legend-items">
        <div class="legend-item" v-for="level in levelConfig" :key="level.level">
          <div class="legend-color" :style="{ backgroundColor: level.color }"></div>
          <span class="legend-text">Level {{ level.level }}: {{ level.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Network, DataSet } from 'vis-network/standalone'
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
import Literature from '@/api/Literature'

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
    },
    taskId: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['entity-selected', 'entity-deselected'],
  setup(props, { emit }) {

    // 组件内部状态
    const networkContainer = ref(null)
    const network = ref(null)
    const internalGraphData = ref({ nodes: [], edges: [] })
    const searchedEntities = ref([])
    const selectedEntityCount = ref(0)
    const physicsEnabled = ref(false) // 树形布局通常不需要物理引擎

    // 层级配置
    // 更新的层级配置（需要替换原来的 levelConfig）
    const levelConfig = [
      { level: 1, name: '疾病状态', color: '#FF6B6B', y: -400 },
      { level: 2, name: '免疫细胞', color: '#4ECDC4', y: -100 },
      { level: 3, name: '病原体', color: '#45B7D1', y: 300 }
    ]

    // 判断是否显示复杂功能（工具栏、信息面板、搜索等）
    const showComplexFeatures = computed(() => {
      return !props.taskId || props.taskId === 0
    })

    // 根据模式选择数据源
    const graphDataComputed = computed(() => {
      return internalGraphData.value
    })

    // 计算属性
    const visibleNodes = computed(() => {
      return graphDataComputed.value.nodes ? graphDataComputed.value.nodes.length : 0
    })

    const visibleEdges = computed(() => {
      return graphDataComputed.value.edges ? graphDataComputed.value.edges.length : 0
    })

    // 获取层级配置
    const getLevelConfig = (level) => {
      return levelConfig.find(config => config.level === level) || levelConfig[1]
    }

    // 获取实体大小（根据层级调整）
    const getEntitySize = (entity) => {
      const baseSize = props.graphSettings.nodeSize || 20
      switch (entity.level) {
        case 1: return baseSize * 1.5  // 疾病状态节点最大
        case 2: return baseSize        // 免疫细胞节点中等
        case 3: return baseSize * 0.8  // 病原体节点较小
        default: return baseSize
      }
    }

    // 计算树形布局位置
    // 计算树形布局位置（支持多行布局，美观优化版）
    const calculateTreeLayout = (entities) => {
      const layout = {}
      const levelGroups = {}

      // 按层级分组
      entities.forEach(entity => {
        if (!levelGroups[entity.level]) {
          levelGroups[entity.level] = []
        }
        levelGroups[entity.level].push(entity)
      })

      // 重新定义层级Y坐标，确保有足够空间
      const levelYPositions = {
        1: -400,    // 疾病状态（顶部）
        2: -100,    // 免疫细胞（中上）
        3: 300      // 病原体（底部）
      }

      // 为每个层级计算位置
      Object.keys(levelGroups).forEach(level => {
        const levelEntities = levelGroups[level]
        const baseY = levelYPositions[parseInt(level)] || 0
        const levelNum = parseInt(level)

        // Level 1 保持单行布局，稍微错开增加美感
        if (levelNum === 1) {
          const totalWidth = 600
          const spacing = totalWidth / (levelEntities.length + 1)

          levelEntities.forEach((entity, index) => {
            const x = -totalWidth / 2 + spacing * (index + 1)
            // 添加轻微的垂直偏移，创造更自然的感觉
            const yOffset = Math.sin(index * 0.5) * 15
            layout[entity.name] = { x, y: baseY + yOffset }
          })
        }
        // Level 2 和 3 支持多行布局
        else if (levelNum === 2 || levelNum === 3) {
          const entitiesPerRow = 5 // 每行最多5个实体
          const totalRows = Math.ceil(levelEntities.length / entitiesPerRow)
          const rowSpacing = 100 // 增加行间距
          const totalWidth = 900 // 增加总宽度

          levelEntities.forEach((entity, index) => {
            const rowIndex = Math.floor(index / entitiesPerRow)
            const colIndex = index % entitiesPerRow
            const entitiesInCurrentRow = Math.min(entitiesPerRow, levelEntities.length - rowIndex * entitiesPerRow)

            // 计算当前行的Y坐标，从baseY开始向下排列
            const rowY = baseY + rowIndex * rowSpacing

            // 计算当前实体的X坐标（居中对齐）
            const rowWidth = Math.min(800, entitiesInCurrentRow * 150) // 根据实体数量调整行宽
            const spacing = rowWidth / (entitiesInCurrentRow + 1)
            let x = -rowWidth / 2 + spacing * (colIndex + 1)

            // 为奇数行添加轻微偏移，创造更自然的布局
            if (rowIndex % 2 === 1) {
              x += 30 // 奇数行右偏移
            }

            // 添加轻微的随机偏移增加美感（但保持相对位置）
            const xOffset = Math.sin(index * 0.3) * 20
            const yOffset = Math.cos(index * 0.4) * 10

            layout[entity.name] = {
              x: x + xOffset,
              y: rowY + yOffset
            }
          })
        }
        // 其他层级保持原有逻辑
        else {
          const totalWidth = 800
          const spacing = totalWidth / (levelEntities.length + 1)

          levelEntities.forEach((entity, index) => {
            const x = -totalWidth / 2 + spacing * (index + 1)
            layout[entity.name] = { x, y: baseY }
          })
        }
      })

      return layout
    }

    // 安全的实体选择方法
    const safeSelectEntities = (entityIds) => {
      if (!network.value) return false

      try {
        network.value.selectNodes(entityIds)
        return true
      } catch (error) {
        console.warn('selectNodes 失败，尝试替代方法:', error)

        try {
          network.value.setSelection({
            nodes: entityIds,
            edges: []
          })
          return true
        } catch (error2) {
          console.warn('setSelection 也失败了，使用手动触发:', error2)

          if (entityIds.length > 0) {
            const entityData = graphDataComputed.value.nodes.find((n) => n.id === entityIds[0])
            if (entityData) {
              emit('entity-selected', entityData)
              selectedEntityCount.value = entityIds.length
            }
          } else {
            emit('entity-deselected')
            selectedEntityCount.value = 0
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
          emit('entity-deselected')
          selectedEntityCount.value = 0
          return false
        }
      }
    }

    // 加载数据的方法
    const loadGraphData = async () => {
      // taskId 模式：从API加载数据
      if (props.taskId && props.taskId !== 0) {
        try {
          const response = await Literature.getAnalyzeDetail(props.taskId)
          console.log("传入id ", props.taskId)

          if (response.data.data) {
            internalGraphData.value = {
              nodes: response.data.data.nodes || [],
              edges: response.data.data.edges || [],
            }
            console.log(response.data.data)
            await nextTick()
            initializeNetwork()
          }
        } catch (error) {
          console.error('加载任务数据失败:', error)
        }
      }
      else {
        try {
          const params = {
            verified_only: false,
            limit: 500,
          }

          if (props.selectedFilters.selectedEntityTypes?.length > 0) {
            params.entity_type = props.selectedFilters.selectedEntityTypes.join(',')
          }

          console.log("采用方式2: ")
          const response = await KnowledgeGraph.getGraph(params)
          if (response.data.data) {
            internalGraphData.value = {
              nodes: response.data.data.nodes || [],
              edges: response.data.data.edges || [],
            }
            console.log(response.data.data)
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
      console.log('[GraphVisualization] 初始化网络图')
      console.log('子组件中[GraphVisualization] :', graphDataComputed.value)
      console.log('[GraphVisualization] 实体数量:', graphDataComputed.value.nodes?.length)
      console.log('[GraphVisualization] 关系数量:', graphDataComputed.value.edges?.length)

      if (!networkContainer.value || !graphDataComputed.value.nodes.length) {
        return
      }

      try {
        // 计算树形布局
        const layout = calculateTreeLayout(graphDataComputed.value.nodes)

        // 处理节点数据
        const nodes = new DataSet(
          graphDataComputed.value.nodes.map((entity) => {
            const levelConfig = getLevelConfig(entity.level)
            const position = layout[entity.name] || { x: 0, y: 0 }

            return {
              id: entity.name, // 使用name作为id
              label: props.graphSettings.showLabels ? entity.name : '',
              title: `${entity.name}\n层级: Level ${entity.level}\n类型: ${entity.entity_type || '未分类'}\n子类型: ${entity.subtype || '无'}`,
              group: `level-${entity.level}`,
              x: position.x,
              y: position.y,
              fixed: true, // 固定节点位置以保持树形结构
              color: {
                background: levelConfig.color,
                border: '#ffffff',
                highlight: {
                  background: levelConfig.color,
                  border: '#333333',
                },
              },
              size: getEntitySize(entity),
              font: {
                size: 14,
                color: '#333',
                face: 'Arial, sans-serif',
                bold: entity.level === 1 // 第一层级加粗
              },
              borderWidth: 2,
              shadow: {
                enabled: true,
                color: 'rgba(0, 0, 0, 0.1)',
                size: 5,
                x: 2,
                y: 2
              }
            }
          })
        )

        // 处理边数据
        const edges = new DataSet(
          (graphDataComputed.value.edges || []).map((edge, index) => ({
            id: `edge-${index}`,
            from: edge.source_entity.name,
            to: edge.target_entity.name,
            label: edge.factor ? edge.factor.factor_name : '',
            title: `因子: ${edge.factor?.factor_name || '未知'}\n类型: ${edge.factor?.factor_type || '未知'}\n效应: ${edge.factor?.effect || '未知'}\n描述: ${edge.factor?.description || '无描述'}`,
            width: props.graphSettings.edgeWidth || 2,
            color: {
              color: '#666666',
              highlight: '#333333',
              opacity: 0.7,
            },
            smooth: {
              type: 'cubicBezier',
              forceDirection: 'vertical',
              roundness: 0.4
            },
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 1,
                type: 'arrow'
              },
            },
            font: {
              size: 10,
              color: '#444',
              strokeWidth: 2,
              strokeColor: '#ffffff'
            }
          }))
        )

        // 网络配置
        const options = {
          physics: {
            enabled: false, // 禁用物理引擎以保持树形布局
          },
          interaction: {
            hover: true,
            hoverConnectedEdges: true,
            selectConnectedEdges: false,
            tooltipDelay: 300,
            zoomView: true,
            dragView: true,
            dragNodes: false // 禁止拖拽节点以保持布局
          },
          nodes: {
            borderWidth: 2,
            shadow: true,
            font: {
              size: 14,
              face: 'Arial, sans-serif'
            },
            chosen: {
              node: function (values, id, selected, hovering) {
                values.shadow = true
                values.shadowSize = 10
                values.shadowColor = 'rgba(0, 0, 0, 0.3)'
              }
            }
          },
          edges: {
            shadow: false,
            smooth: {
              type: 'cubicBezier',
              forceDirection: 'vertical',
              roundness: 0.4
            },
            chosen: {
              edge: function (values, id, selected, hovering) {
                values.width = values.width * 1.5
              }
            }
          },
          layout: {
            hierarchical: false // 使用自定义位置而不是内置层次布局
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

        // 自动适应画面
        setTimeout(() => {
          resetZoom()
        }, 100)

      } catch (error) {
        console.error('初始化网络图失败:', error)
      }
    }

    // 设置事件监听器
    const setupEventListeners = () => {
      if (!network.value) return

      // 实体选择事件
      network.value.on('selectNode', (params) => {
        if (params.nodes.length > 0) {
          const entityId = params.nodes[0]
          const entityData = graphDataComputed.value.nodes.find((n) => n.name === entityId)
          if (entityData) {
            emit('entity-selected', entityData)
          }
        }
        selectedEntityCount.value = params.nodes.length
      })

      // 实体取消选择事件
      network.value.on('deselectNode', () => {
        emit('entity-deselected')
        selectedEntityCount.value = 0
      })

      // 双击实体事件
      network.value.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const entityId = params.nodes[0]
          focusOnEntity(entityId)
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
          const entityIds = network.value.getSelectedNodes()
          if (entityIds.length > 0) {
            network.value.focus(entityIds[0], {
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

    // 搜索功能
    const searchEntities = (keyword) => {
      if (!keyword || !graphDataComputed.value.nodes) {
        searchedEntities.value = []
        safeClearSelection()
        return
      }

      const results = graphDataComputed.value.nodes.filter(
        (entity) =>
          (entity.name || '')
            .toLowerCase()
            .includes(keyword.toLowerCase()) ||
          (entity.entity_type || '').toLowerCase().includes(keyword.toLowerCase()) ||
          (entity.subtype || '').toLowerCase().includes(keyword.toLowerCase())
      )

      searchedEntities.value = results.slice(0, 10)

      if (network.value && results.length > 0) {
        const entityIds = results.map((entity) => entity.name)
        const success = safeSelectEntities(entityIds)

        if (success && results.length === 1) {
          setTimeout(() => {
            focusOnEntity(results[0].name)
          }, 100)
        } else if (!success && results.length === 1) {
          focusOnEntity(results[0].name)
        }
      }
    }

    // 清除搜索
    const clearSearch = () => {
      searchedEntities.value = []
      safeClearSelection()
    }

    // 聚焦到指定实体
    const focusOnEntity = (entityId) => {
      if (!network.value) return

      try {
        network.value.focus(entityId, {
          scale: 1.5,
          animation: {
            duration: 800,
            easingFunction: 'easeInOutQuart',
          },
        })

        setTimeout(() => {
          const success = safeSelectEntities([entityId])
          if (!success) {
            const entityData = graphDataComputed.value.nodes.find((n) => n.name === entityId)
            if (entityData) {
              emit('entity-selected', entityData)
              selectedEntityCount.value = 1
            }
          }
        }, 200)
      } catch (error) {
        console.error('聚焦实体失败:', error)
        const entityData = graphDataComputed.value.nodes.find((n) => n.name === entityId)
        if (entityData) {
          emit('entity-selected', entityData)
          selectedEntityCount.value = 1
        }
      }
    }

    // 重新加载数据
    const reloadData = () => {
      loadGraphData()
    }

    // 监听器
    watch(
      () => props.selectedFilters,
      () => {
        if (!props.taskId || props.taskId === 0) {
          loadGraphData()
        }
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
      showComplexFeatures,
      graphDataComputed,
      levelConfig,

      // 状态
      searchedEntities,
      selectedEntityCount,
      physicsEnabled,

      // 方法
      zoomIn,
      zoomOut,
      resetZoom,
      centerGraph,
      togglePhysics,
      exportImage,
      searchEntities,
      clearSearch,
      focusOnEntity,
      reloadData,
    }
  }
}
</script>
<style scoped>
.graph-visualization {
  position: relative;
  width: 100%;
  height: 600px;
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

.loading-text {
  color: #666;
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

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #ddd;
  margin: 0 8px;
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

.info-icon {
  color: #666;
  font-size: 16px;
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

.search-results {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  max-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
  z-index: 100;
  overflow: hidden;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #333;
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
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.search-item:hover {
  background: #f9f9f9;
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
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.arrow-icon {
  color: #ccc;
  font-size: 16px;
  transition: color 0.2s;
}

.search-item:hover .arrow-icon {
  color: #666;
}

/* 滚动条样式 */
.search-list::-webkit-scrollbar {
  width: 6px;
}

.search-list::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.search-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.search-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>