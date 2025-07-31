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

        <div class="toolbar-divider"></div>

        <el-tooltip content="显示/隐藏层级圆圈" placement="bottom">
          <button @click="toggleLevelCircles" class="toolbar-btn" :class="{ active: showLevelCircles }">
            <el-icon>
              <Connection />
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
    const physicsEnabled = ref(false)
    const showLevelCircles = ref(true)
    const levelCircles = ref([]) // 存储圆圈SVG元素

    // 层级配置 - 扩大半径让节点更舒展
    const levelConfig = [
      { level: 1, name: '疾病状态', color: '#FF6B6B', radius: 80 },      // 中心区域半径扩大
      { level: 2, name: '免疫细胞', color: '#4ECDC4', radius: 280 },     // 第一圆环半径扩大
      { level: 3, name: '病原体', color: '#45B7D1', radius: 0 }          // Level 3 不限制在圆形内
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

    // 获取Level 1实体的中心位置
    const getLevel1Center = () => {
      if (!network.value || !graphDataComputed.value.nodes) {
        return { x: 0, y: 0 }
      }

      const level1Entities = graphDataComputed.value.nodes.filter(entity => entity.level === 1)
      if (level1Entities.length === 0) {
        return { x: 0, y: 0 }
      }

      // 如果只有一个Level 1实体，返回其位置
      if (level1Entities.length === 1) {
        try {
          const positions = network.value.getPositions([level1Entities[0].name])
          const position = positions[level1Entities[0].name]
          return position || { x: 0, y: 0 }
        } catch (error) {
          console.warn('获取Level 1实体位置失败:', error)
          return { x: 0, y: 0 }
        }
      }

      // 如果有多个Level 1实体，计算它们的中心点
      try {
        const entityNames = level1Entities.map(entity => entity.name)
        const positions = network.value.getPositions(entityNames)

        let totalX = 0, totalY = 0, validCount = 0

        Object.values(positions).forEach(pos => {
          if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
            totalX += pos.x
            totalY += pos.y
            validCount++
          }
        })

        return validCount > 0 ? {
          x: totalX / validCount,
          y: totalY / validCount
        } : { x: 0, y: 0 }
      } catch (error) {
        console.warn('计算Level 1中心位置失败:', error)
        return { x: 0, y: 0 }
      }
    }

    // 创建层级圆圈
    const createLevelCircles = () => {
      if (!network.value || !networkContainer.value || !showLevelCircles.value) {
        return
      }

      // 清除现有圆圈
      clearLevelCircles()

      try {
        const canvas = network.value.canvas.frame.canvas
        const canvasContainer = canvas.parentElement

        // 创建SVG覆盖层
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.style.position = 'absolute'
        svg.style.top = '0'
        svg.style.left = '0'
        svg.style.width = '100%'
        svg.style.height = '100%'
        svg.style.pointerEvents = 'none'
        svg.style.zIndex = '1'
        svg.setAttribute('class', 'level-circles-svg')

        // 创建Level 1和Level 2之间的圆圈
        const circle1to2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle1to2.setAttribute('r', levelConfig[0].radius.toString())
        circle1to2.setAttribute('fill', 'none')
        circle1to2.setAttribute('stroke', levelConfig[0].color)
        circle1to2.setAttribute('stroke-width', '2')
        circle1to2.setAttribute('stroke-dasharray', '5,5')
        circle1to2.setAttribute('opacity', '0.6')

        // 创建Level 2和Level 3之间的圆圈
        const circle2to3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle2to3.setAttribute('r', levelConfig[1].radius.toString())
        circle2to3.setAttribute('fill', 'none')
        circle2to3.setAttribute('stroke', levelConfig[1].color)
        circle2to3.setAttribute('stroke-width', '2')
        circle2to3.setAttribute('stroke-dasharray', '10,5')
        circle2to3.setAttribute('opacity', '0.6')

        svg.appendChild(circle1to2)
        svg.appendChild(circle2to3)
        canvasContainer.appendChild(svg)

        // 存储圆圈元素引用
        levelCircles.value = [
          { element: circle1to2, radius: levelConfig[0].radius },
          { element: circle2to3, radius: levelConfig[1].radius }
        ]

        // 初始更新位置
        updateCirclePositions()

      } catch (error) {
        console.error('创建层级圆圈失败:', error)
      }
    }

    // 更新圆圈位置
    const updateCirclePositions = () => {
      if (!network.value || levelCircles.value.length === 0 || !showLevelCircles.value) {
        return
      }

      try {
        const center = getLevel1Center()
        const canvasPosition = network.value.canvasToDOM(center)

        levelCircles.value.forEach(circle => {
          if (circle.element) {
            circle.element.setAttribute('cx', canvasPosition.x.toString())
            circle.element.setAttribute('cy', canvasPosition.y.toString())
          }
        })
      } catch (error) {
        console.warn('更新圆圈位置失败:', error)
      }
    }

    // 清除层级圆圈
    const clearLevelCircles = () => {
      if (networkContainer.value) {
        const existingSvg = networkContainer.value.querySelector('.level-circles-svg')
        if (existingSvg) {
          existingSvg.remove()
        }
      }
      levelCircles.value = []
    }

    // 切换层级圆圈显示
    const toggleLevelCircles = () => {
      showLevelCircles.value = !showLevelCircles.value
      if (showLevelCircles.value) {
        setTimeout(createLevelCircles, 100)
      } else {
        clearLevelCircles()
      }
    }

    // 获取层级配置
    const getLevelConfig = (level) => {
      return levelConfig.find(config => config.level === level) || levelConfig[2]
    }

    // 获取实体大小（根据层级调整）
    const getEntitySize = (entity) => {
      const baseSize = props.graphSettings.nodeSize || 20
      switch (entity.level) {
        case 1: return baseSize * 2    // 中心节点最大
        case 2: return baseSize * 1.3  // 第一圆环节点中等
        case 3: return baseSize        // 第二圆环节点标准
        default: return baseSize
      }
    }

    // 检查节点是否可以在指定位置放置（避免重叠）- 增大最小距离
    const isPositionValid = (x, y, existingPositions, minDistance = 60) => {
      return !existingPositions.some(pos => {
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
        return distance < minDistance
      })
    }

    // 生成Level 3的随机位置（避开Level 1和2的区域）- 更大的散布范围
    const generateLevel3Position = (existingPositions, canvasWidth = 1200, canvasHeight = 900) => {
      const level2Radius = levelConfig[1].radius
      const margin = 80
      const maxAttempts = 100

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // 在更大的画布范围内生成随机位置
        const x = (Math.random() - 0.5) * (canvasWidth - 2 * margin)
        const y = (Math.random() - 0.5) * (canvasHeight - 2 * margin)

        // 确保不在Level 2的圆环内
        const distanceFromCenter = Math.sqrt(x ** 2 + y ** 2)
        if (distanceFromCenter > level2Radius + 60) {
          // 检查是否与其他节点重叠
          if (isPositionValid(x, y, existingPositions, 50)) {
            return { x, y }
          }
        }
      }

      // 如果找不到合适位置，返回一个相对安全的位置
      const angle = Math.random() * 2 * Math.PI
      const distance = level2Radius + 120 + Math.random() * 200
      return {
        x: distance * Math.cos(angle),
        y: distance * Math.sin(angle)
      }
    }

    // 计算改进的圆形布局位置 - 更舒展的分布
    const calculateCircularLayout = (entities) => {
      const layout = {}
      const levelGroups = {}
      const existingPositions = []

      // 按层级分组
      entities.forEach(entity => {
        if (!levelGroups[entity.level]) {
          levelGroups[entity.level] = []
        }
        levelGroups[entity.level].push(entity)
      })

      // Level 1: 中心区域（增大分布范围）
      if (levelGroups[1]) {
        const level1Entities = levelGroups[1]
        const centerRadius = levelConfig[0].radius

        level1Entities.forEach((entity, index) => {
          if (level1Entities.length === 1) {
            // 只有一个节点时放在正中心
            layout[entity.name] = { x: 0, y: 0 }
          } else {
            // 多个节点时在中心区域更均匀分布
            const angle = (index * 2 * Math.PI) / level1Entities.length + Math.random() * 0.3
            const radius = Math.random() * (centerRadius - 30) + 20 // 最小半径20，避免过于靠近中心
            const x = radius * Math.cos(angle)
            const y = radius * Math.sin(angle)
            layout[entity.name] = { x, y }
          }
          existingPositions.push(layout[entity.name])
        })
      }

      // Level 2: 圆环区域（更大范围，更均匀分布）
      if (levelGroups[2]) {
        const level2Entities = levelGroups[2]
        const innerRadius = levelConfig[0].radius + 40  // 增大与Level 1的距离
        const outerRadius = levelConfig[1].radius - 30  // 保持与边界的距离

        // 先计算角度分布，让节点更均匀
        const angleStep = (2 * Math.PI) / level2Entities.length

        level2Entities.forEach((entity, index) => {
          let position
          let attempts = 0
          const maxAttempts = 50

          do {
            // 基于索引的角度分布 + 随机偏移
            const baseAngle = index * angleStep
            const angleOffset = (Math.random() - 0.5) * 0.6 // 增大角度偏移
            const angle = baseAngle + angleOffset

            // 在圆环内随机选择半径，但倾向于中间位置
            const radiusRange = outerRadius - innerRadius
            const radiusFactor = 0.3 + Math.random() * 0.7 // 偏向外侧
            const radius = innerRadius + radiusRange * radiusFactor

            const x = radius * Math.cos(angle)
            const y = radius * Math.sin(angle)

            position = { x, y }
            attempts++
          } while (!isPositionValid(position.x, position.y, existingPositions, 50) && attempts < maxAttempts)

          layout[entity.name] = position
          existingPositions.push(position)
        })
      }

      // Level 3: 外围区域（大幅扩散分布）
      if (levelGroups[3]) {
        const level3Entities = levelGroups[3]
        const level2Radius = levelConfig[1].radius

        // 将Level 3节点分成几个扇形区域来分布
        const sectorCount = Math.max(4, Math.ceil(level3Entities.length / 8))
        const anglePerSector = (2 * Math.PI) / sectorCount

        level3Entities.forEach((entity, index) => {
          const sectorIndex = index % sectorCount
          const nodeIndexInSector = Math.floor(index / sectorCount)

          // 基础角度 + 扇形内的随机偏移
          const baseAngle = sectorIndex * anglePerSector
          const angleOffset = (Math.random() - 0.5) * anglePerSector * 0.8
          const angle = baseAngle + angleOffset

          // 距离：在Level 2外围 + 随机分布
          const minDistance = level2Radius + 80
          const maxDistance = level2Radius + 300 + (nodeIndexInSector * 50)
          const distance = minDistance + Math.random() * (maxDistance - minDistance)

          let position = {
            x: distance * Math.cos(angle),
            y: distance * Math.sin(angle)
          }

          // 如果位置冲突，尝试微调
          let attempts = 0
          while (!isPositionValid(position.x, position.y, existingPositions, 45) && attempts < 30) {
            const adjustAngle = angle + (Math.random() - 0.5) * 0.5
            const adjustDistance = distance + (Math.random() - 0.5) * 100
            position = {
              x: adjustDistance * Math.cos(adjustAngle),
              y: adjustDistance * Math.sin(adjustAngle)
            }
            attempts++
          }

          layout[entity.name] = position
          existingPositions.push(position)
        })
      }

      return layout
    }

    // 限制节点在其层级区域内拖拽的函数 - 更宽松的限制
    const constrainNodePosition = (nodeId, position) => {
      const entity = graphDataComputed.value.nodes.find(n => n.name === nodeId)
      if (!entity) return position

      const { x, y } = position
      const distanceFromCenter = Math.sqrt(x ** 2 + y ** 2)

      switch (entity.level) {
        case 1:
          // Level 1: 限制在中心区域内
          const maxRadius1 = levelConfig[0].radius
          if (distanceFromCenter > maxRadius1) {
            const angle = Math.atan2(y, x)
            return {
              x: maxRadius1 * Math.cos(angle),
              y: maxRadius1 * Math.sin(angle)
            }
          }
          break

        case 2:
          // Level 2: 限制在圆环内
          const minRadius2 = levelConfig[0].radius + 20
          const maxRadius2 = levelConfig[1].radius

          if (distanceFromCenter < minRadius2) {
            const angle = Math.atan2(y, x)
            return {
              x: minRadius2 * Math.cos(angle),
              y: minRadius2 * Math.sin(angle)
            }
          } else if (distanceFromCenter > maxRadius2) {
            const angle = Math.atan2(y, x)
            return {
              x: maxRadius2 * Math.cos(angle),
              y: maxRadius2 * Math.sin(angle)
            }
          }
          break

        case 3:
          // Level 3: 只要不在Level 2圆环内即可，更宽松
          const level2Radius = levelConfig[1].radius
          if (distanceFromCenter < level2Radius + 40) {
            const angle = Math.atan2(y, x)
            return {
              x: (level2Radius + 50) * Math.cos(angle),
              y: (level2Radius + 50) * Math.sin(angle)
            }
          }
          break
      }

      return position
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
      console.log('[GraphVisualization] 初始化优化的圆形网络图')
      console.log('子组件中[GraphVisualization] :', graphDataComputed.value)
      console.log('[GraphVisualization] 实体数量:', graphDataComputed.value.nodes?.length)
      console.log('[GraphVisualization] 关系数量:', graphDataComputed.value.edges?.length)

      if (!networkContainer.value || !graphDataComputed.value.nodes.length) {
        return
      }

      try {
        // 计算优化的圆形布局
        const layout = calculateCircularLayout(graphDataComputed.value.nodes)

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
              fixed: false, // 允许拖拽
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
                size: entity.level === 1 ? 16 : 14,
                color: '#333',
                face: 'Arial, sans-serif',
                bold: entity.level === 1 // 中心节点加粗
              },
              borderWidth: entity.level === 1 ? 3 : 2,
              shadow: {
                enabled: true,
                color: 'rgba(0, 0, 0, 0.15)',
                size: entity.level === 1 ? 8 : 5,
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
              color: '#888888',
              highlight: '#333333',
              opacity: 0.6,
            },
            smooth: {
              type: 'curvedCW',
              roundness: 0.2
            },
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 1.2,
                type: 'arrow'
              },
            },
            font: {
              size: 10,
              color: '#555',
              strokeWidth: 2,
              strokeColor: '#ffffff'
            }
          }))
        )

        // 网络配置
        const options = {
          physics: {
            enabled: false, // 默认禁用物理引擎以保持布局
          },
          interaction: {
            hover: true,
            hoverConnectedEdges: true,
            selectConnectedEdges: false,
            tooltipDelay: 300,
            zoomView: true,
            dragView: true, // 允许整体拖拽视图
            dragNodes: true  // 允许拖拽单个节点
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
                values.shadowSize = 12
                values.shadowColor = 'rgba(0, 0, 0, 0.4)'
              }
            }
          },
          edges: {
            shadow: false,
            smooth: {
              type: 'curvedCW',
              roundness: 0.2
            },
            chosen: {
              edge: function (values, id, selected, hovering) {
                values.width = values.width * 1.5
              }
            }
          },
          layout: {
            hierarchical: false
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
          // 创建层级圆圈
          if (showLevelCircles.value) {
            createLevelCircles()
          }
        }, 100)

      } catch (error) {
        console.error('初始化网络图失败:', error)
      }
    }

    // 设置事件监听器
    const setupEventListeners = () => {
      if (!network.value) return

      // 节点拖拽约束
      network.value.on('dragEnd', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const positions = network.value.getPositions([nodeId])
          const currentPosition = positions[nodeId]

          // 应用位置约束
          const constrainedPosition = constrainNodePosition(nodeId, currentPosition)

          // 如果位置被调整，更新节点位置
          if (constrainedPosition.x !== currentPosition.x || constrainedPosition.y !== currentPosition.y) {
            network.value.moveNode(nodeId, constrainedPosition.x, constrainedPosition.y)
          }

          // 更新圆圈位置（特别是当Level 1节点被拖拽时）
          const entity = graphDataComputed.value.nodes.find(n => n.name === nodeId)
          if (entity && entity.level === 1) {
            setTimeout(updateCirclePositions, 50)
          }
        }
      })

      // 节点拖拽过程中实时更新圆圈位置
      network.value.on('dragging', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const entity = graphDataComputed.value.nodes.find(n => n.name === nodeId)
          if (entity && entity.level === 1) {
            updateCirclePositions()
          }
        }
      })

      // 视图变化时更新圆圈位置
      network.value.on('zoom', () => {
        setTimeout(updateCirclePositions, 10)
      })

      network.value.on('dragStart', () => {
        // 开始拖拽视图时
      })

      network.value.on('dragEnd', () => {
        // 结束拖拽视图时更新圆圈位置
        setTimeout(updateCirclePositions, 10)
      })

      // 监听画布移动
      network.value.on('animationFinished', () => {
        updateCirclePositions()
      })

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

      // 监听整体视图拖拽和缩放，实时更新圆圈位置
      let updateTimer = null
      const throttledUpdate = () => {
        if (updateTimer) clearTimeout(updateTimer)
        updateTimer = setTimeout(updateCirclePositions, 16) // ~60fps
      }

      // 使用Canvas的原生事件来监听视图变化
      if (network.value.canvas && network.value.canvas.frame && network.value.canvas.frame.canvas) {
        const canvas = network.value.canvas.frame.canvas

        // 监听鼠标滚轮（缩放）
        canvas.addEventListener('wheel', throttledUpdate)

        // 监听鼠标拖拽（平移）
        let isDragging = false
        canvas.addEventListener('mousedown', (e) => {
          // 只有在没有选中节点时才认为是拖拽视图
          if (network.value.getSelectedNodes().length === 0) {
            isDragging = true
          }
        })

        canvas.addEventListener('mousemove', (e) => {
          if (isDragging) {
            throttledUpdate()
          }
        })

        canvas.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false
            updateCirclePositions()
          }
        })
      }
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
          setTimeout(updateCirclePositions, 350)
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
          setTimeout(updateCirclePositions, 350)
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
          setTimeout(updateCirclePositions, 850)
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
          setTimeout(updateCirclePositions, 850)
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
          // 物理引擎变化后更新圆圈位置
          setTimeout(updateCirclePositions, 100)
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
          link.download = `LiverScholar-circular-knowledge-graph-${Date.now()}.png`
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
          updateCirclePositions()
        }, 850)
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

    // 监听圆圈显示状态变化
    watch(showLevelCircles, (newValue) => {
      if (newValue) {
        setTimeout(createLevelCircles, 100)
      } else {
        clearLevelCircles()
      }
    })

    // 生命周期
    onMounted(() => {
      loadGraphData()
    })

    onBeforeUnmount(() => {
      // 清理定时器和事件监听器
      clearLevelCircles()

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
      showLevelCircles,

      // 方法
      zoomIn,
      zoomOut,
      resetZoom,
      centerGraph,
      togglePhysics,
      toggleLevelCircles,
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
  height: 100%;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.graph-canvas {
  width: 100%;
  height: 100%;
  position: relative;
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
  border: 4px solid #e1e5e9;
  border-left: 4px solid #4ECDC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}



.graph-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #666;
}

.toolbar-btn:hover {
  background: rgba(78, 205, 196, 0.1);
  color: #4ECDC4;
}

.toolbar-btn.active {
  background: #4ECDC4;
  color: white;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e1e5e9;
  margin: 0 4px;
}

.graph-info-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.info-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.info-icon {
  color: #4ECDC4;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.info-label {
  color: #666;
}

.search-results {
  position: absolute;
  top: 80px;
  left: 16px;
  width: 280px;
  max-height: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 100;
  overflow: hidden;
}

.search-header {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e5e9;
}

.search-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.clear-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(255, 107, 107, 0.1);
  color: #FF6B6B;
}

.search-list {
  max-height: 320px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f5f5f5;
}

.search-item:hover {
  background: rgba(78, 205, 196, 0.05);
}

.search-item:last-child {
  border-bottom: none;
}

.entity-info {
  flex: 1;
}

.entity-name {
  display: block;
  font-weight: 500;
  color: #333;
  font-size: 14px;
  margin-bottom: 2px;
}

.entity-level {
  font-size: 12px;
  color: #666;
}

.arrow-icon {
  color: #ccc;
  transition: all 0.2s ease;
}

.search-item:hover .arrow-icon {
  color: #4ECDC4;
  transform: translateX(2px);
}

.level-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.legend-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 8px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.legend-text {
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .graph-toolbar {
    top: 8px;
    left: 8px;
    padding: 6px;
  }

  .toolbar-btn {
    width: 32px;
    height: 32px;
  }

  .graph-info-panel {
    top: 8px;
    right: 8px;
    padding: 8px 12px;
  }

  .search-results {
    left: 8px;
    width: calc(100vw - 32px);
    max-width: 280px;
  }

  .level-legend {
    bottom: 8px;
    left: 8px;
  }
}
</style>