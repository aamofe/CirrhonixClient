// src/composables/useGraphVisualization.js
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Network, DataSet } from 'vis-network/standalone'
import bus from '@/utils/bus'

export function useGraphVisualization(networkContainer, props) {
  const network = ref(null)
  const physicsEnabled = ref(false)
  const highlightedNodes = ref([])
  const currentGraphData = ref(ref(null))

  const showEdgeCard = ref(false)
  const selectedEdgeData = ref({})
  const cardPosition = ref({ x: 0, y: 0 })

  const showNodeCard = ref(false)
  const selectedNodeData = ref({})

  const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const levelConfig = [
    { level: 1, name: '疾病状态', color: '#FF6B6B', radius: 30 },
    { level: 2, name: '免疫细胞', color: '#4ECDC4', radius: 130 },
    { level: 3, name: '病原体', color: '#45B7D1', radius: 200 },
  ]

  const getLevelConfig = (level) => {
    return (
      levelConfig.find((config) => config.level === level) || levelConfig[2]
    )
  }

  const getEntitySize = (entity) => {
    const baseSize = props.graphSettings.nodeSize || 20
    switch (entity.level) {
      case 1:
        return baseSize * 2
      case 2:
        return baseSize * 1.3
      case 3:
        return baseSize
      default:
        return baseSize
    }
  }

  const showEdgeInfo = (edgeData, position) => {
    selectedEdgeData.value = edgeData

    const cardWidth = 480
    const cardHeight = 600
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    let x = position.x
    let y = position.y

    if (x + cardWidth > screenWidth) {
      x = screenWidth - cardWidth - 20
    }

    if (x < 20) {
      x = 20
    }

    if (y + cardHeight > screenHeight) {
      y = screenHeight - cardHeight - 20
    }

    if (y < 20) {
      y = 20
    }

    cardPosition.value = { x, y }
    showEdgeCard.value = true
  }

  const closeEdgeCard = () => {
    showEdgeCard.value = false
    selectedEdgeData.value = {}
  }

  const showNodeInfo = (nodeData, position) => {
    selectedNodeData.value = nodeData

    const cardWidth = 480
    const cardHeight = 600
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    let x = position.x
    let y = position.y

    if (x + cardWidth > screenWidth) {
      x = screenWidth - cardWidth - 20
    }

    if (x < 20) {
      x = 20
    }

    if (y + cardHeight > screenHeight) {
      y = screenHeight - cardHeight - 20
    }

    if (y < 20) {
      y = 20
    }

    cardPosition.value = { x, y }
    showNodeCard.value = true
    showEdgeCard.value = false
  }

  const closeNodeCard = () => {
    showNodeCard.value = false
    selectedNodeData.value = {}
  }

  const handleRelationUpdated = () => {
    bus.emit('graph-updated')
  }

  const calculateOptimizedLayout = (entities) => {
    const layout = {}
    const levelGroups = {}

    entities.forEach((entity) => {
      if (!levelGroups[entity.level]) levelGroups[entity.level] = []
      levelGroups[entity.level].push(entity)
    })

    if (levelGroups[1]) {
      const nodes = levelGroups[1]

      if (nodes.length === 1) {
        layout[nodes[0].id] = { x: 0, y: 0 }
      } else if (nodes.length === 2) {
        layout[nodes[0].id] = { x: -40, y: 0 }
        layout[nodes[1].id] = { x: 40, y: 0 }
      } else {
        const radius = Math.max(50, nodes.length * 12)
        nodes.forEach((entity, index) => {
          const angle = (index * 2 * Math.PI) / nodes.length
          layout[entity.id] = {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
          }
        })
      }
    }

    if (levelGroups[2]) {
      const nodes = levelGroups[2]
      const baseRadius = 250
      const ringSpacing = 80
      const minAngle = Math.PI / 8
      const maxNodesPerRing = Math.floor((2 * Math.PI) / minAngle)
      const ringCount = Math.ceil(nodes.length / maxNodesPerRing)

      let nodeIndex = 0
      for (let ring = 0; ring < ringCount; ring++) {
        const nodesInRing = Math.min(maxNodesPerRing, nodes.length - nodeIndex)
        const currentRadius = baseRadius + ring * ringSpacing

        const angleOffset =
          ring * (Math.PI / 6) + Math.random() * (Math.PI / 12)

        for (let i = 0; i < nodesInRing; i++) {
          const entity = nodes[nodeIndex + i]
          const angle = (i * 2 * Math.PI) / nodesInRing + angleOffset

          const radiusJitter = (Math.random() - 0.5) * 30
          const angleJitter = (Math.random() - 0.5) * (Math.PI / 16)

          const finalRadius = currentRadius + radiusJitter
          const finalAngle = angle + angleJitter

          layout[entity.id] = {
            x: finalRadius * Math.cos(finalAngle),
            y: finalRadius * Math.sin(finalAngle),
          }
        }

        nodeIndex += nodesInRing
      }
    }

    if (levelGroups[3]) {
      const nodes = levelGroups[3]
      const startRadius = 400
      const ringSpacing = 90
      const minNodeDistance = 60

      const calculateOptimalNodesPerRing = (radius) => {
        const circumference = 2 * Math.PI * radius
        const optimalNodes = Math.floor(circumference / minNodeDistance)
        return Math.max(6, Math.min(optimalNodes, 16))
      }

      let remainingNodes = nodes.length
      let currentIndex = 0
      let ringIndex = 0

      while (remainingNodes > 0) {
        const currentRadius = startRadius + ringIndex * ringSpacing
        const maxNodesThisRing = calculateOptimalNodesPerRing(currentRadius)
        const nodesThisRing = Math.min(remainingNodes, maxNodesThisRing)

        const baseAngle = Math.random() * Math.PI

        for (let i = 0; i < nodesThisRing; i++) {
          const entity = nodes[currentIndex + i]
          const angle = baseAngle + (i * 2 * Math.PI) / nodesThisRing

          const radiusJitter = (Math.random() - 0.5) * 40
          const angleJitter = (Math.random() - 0.5) * (Math.PI / 12)

          const finalRadius = currentRadius + radiusJitter
          const finalAngle = angle + angleJitter

          layout[entity.id] = {
            x: finalRadius * Math.cos(finalAngle),
            y: finalRadius * Math.sin(finalAngle),
          }
        }

        currentIndex += nodesThisRing
        remainingNodes -= nodesThisRing
        ringIndex++
      }
    }

    return layout
  }

  const resolveLayoutConflicts = (layout) => {
    const positions = Object.entries(layout)
    const minDistance = 35
    const resolved = { ...layout }

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const [id1, pos1] = positions[i]
        const [id2, pos2] = positions[j]

        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance && distance > 0) {
          const pushDistance = (minDistance - distance) / 2
          const pushX = (dx / distance) * pushDistance
          const pushY = (dy / distance) * pushDistance

          resolved[id1] = {
            x: pos1.x - pushX,
            y: pos1.y - pushY,
          }
          resolved[id2] = {
            x: pos2.x + pushX,
            y: pos2.y + pushY,
          }
        }
      }
    }
    return resolved
  }

  const calculateFinalLayout = (entities) => {
    const initialLayout = calculateOptimizedLayout(entities)
    const finalLayout = resolveLayoutConflicts(initialLayout)
    return finalLayout
  }

  const clearHighlight = () => {
    if (!network.value || highlightedNodes.value.length === 0) return

    try {
      const nodes = network.value.body.data.nodes
      const updates = highlightedNodes.value
        .map((nodeId) => {
          const originalNode = currentGraphData.value.nodes.find(
            (n) => n.id === nodeId
          )
          if (originalNode) {
            const levelConfig = getLevelConfig(originalNode.level)
            return {
              id: nodeId,
              color: {
                background: levelConfig.color,
                border: '#ffffff',
                highlight: { background: levelConfig.color, border: '#333333' },
              },
              borderWidth: originalNode.level === 1 ? 3 : 2,
            }
          }
          return null
        })
        .filter(Boolean)

      if (updates.length > 0) {
        nodes.update(updates)
      }

      try {
        network.value.setSelection({ nodes: [], edges: [] })
      } catch (error) {}

      highlightedNodes.value = []
    } catch (error) {
      highlightedNodes.value = []
    }
  }

  const getFilteredGraphData = (keyword) => {
    const lowerCaseKeyword = keyword.toLowerCase()
    const allNodes = props.graphData.nodes
    const allEdges = props.graphData.edges

    const matchingNodes = allNodes.filter(
      (node) =>
        node.name &&
        typeof node.name === 'string' &&
        node.name.toLowerCase().includes(lowerCaseKeyword)
    )
    if (matchingNodes.length === 0) {
      return { nodes: [], edges: [], matchedNodeIds: [] }
    }

    const connectedNodeIds = new Set(matchingNodes.map((node) => node.id))
    const matchedNodeIds = new Set(matchingNodes.map((node) => node.id))

    allEdges.forEach((edge) => {
      if (connectedNodeIds.has(edge.from) || connectedNodeIds.has(edge.to)) {
        connectedNodeIds.add(edge.from)
        connectedNodeIds.add(edge.to)
      }
    })

    const filteredNodes = allNodes.filter((node) =>
      connectedNodeIds.has(node.id)
    )
    const filteredEdges = allEdges.filter(
      (edge) =>
        // 修复点: 访问转换后的 'from' 和 'to' 属性
        connectedNodeIds.has(edge.from) && connectedNodeIds.has(edge.to)
    )

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      matchedNodeIds: Array.from(matchedNodeIds),
    }
  }

  const handleSearch = (keyword) => {
    const newKeyword = keyword.trim()
    if (newKeyword) {
      const filteredData = getFilteredGraphData(newKeyword)
      if (filteredData.nodes.length > 0) {
        initializeNetwork(
          filteredData,
          props.graphSettings,
          new Set(filteredData.matchedNodeIds)
        )
      } else {
        if (network.value) network.value.destroy()
      }
    } else {
      resetGraph()
    }
  }

  const debouncedSearch = debounce(handleSearch, 300)

  const initializeNetwork = async (
    graphData,
    graphSettings,
    nodesToHighlight = new Set()
  ) => {
    if (!networkContainer.value || !graphData || !graphData.nodes.length) return

    try {
      currentGraphData.value = graphData

      const layout = calculateFinalLayout(graphData.nodes)

      const nodes = new DataSet(
        graphData.nodes.map((entity) => {
          const isHighlighted = nodesToHighlight.has(entity.id)
          const levelConfig = getLevelConfig(entity.level)
          const position = layout[entity.id] || { x: 0, y: 0 }

          let nodeColor, borderWidth
          if (isHighlighted) {
            nodeColor = {
              background: '#FFD700',
              border: '#FF6B00',
              highlight: { background: '#FFD700', border: '#FF6B00' },
            }
            borderWidth = 4
          } else {
            nodeColor = {
              background: levelConfig.color,
              border: '#ffffff',
              highlight: { background: levelConfig.color, border: '#333333' },
            }
            borderWidth = entity.level === 1 ? 3 : 2
          }

          return {
            id: entity.id,
            label: graphSettings.showLabels ? entity.name : '',
            title: `${entity.name}${
              entity.level > 2
                ? `\n层级: Level ${entity.level}\n类型: ${
                    entity.entity_type || '未分类'
                  }`
                : ''
            }`,
            x: position.x,
            y: position.y,
            color: nodeColor,
            size: getEntitySize(entity),
            font: { size: entity.level === 1 ? 16 : 14, color: '#333' },
            borderWidth: borderWidth,
            shadow: true,
            originalData: entity,
          }
        })
      )

      const edges = new DataSet(
        (graphData.edges || []).map((aggregatedEdge, index) => {
          const factorCount = aggregatedEdge.factors?.length || 0
          const firstFactor = aggregatedEdge.factors?.[0]

          const labelText = graphSettings.showLabels
            ? factorCount > 1
              ? `${firstFactor?.factor_name || ''} 等 (${factorCount})`
              : firstFactor?.factor_name || ''
            : ''

          return {
            id: aggregatedEdge.id,
            from: aggregatedEdge.from,
            to: aggregatedEdge.to,
            label: labelText,
            width: graphSettings.edgeWidth || 2,
            color: { color: '#888888', highlight: '#333333', opacity: 0.6 },
            smooth: { type: 'curvedCW', roundness: 0.2 },
            arrows: { to: { enabled: true, scaleFactor: 1.2 } },
            font: { size: 10, color: '#555' },

            originalData: aggregatedEdge.originalData,
          }
        })
      )

      const optimizedNetworkOptions = {
        physics: { enabled: false },
        interaction: {
          hover: true,
          hoverConnectedEdges: true,
          selectConnectedEdges: false,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true,
          dragNodes: true,
        },
        nodes: {
          borderWidth: 2,
          shadow: true,
          font: {
            face: 'Arial, sans-serif',
            color: '#333',
          },
        },
        edges: {
          shadow: false,
          smooth: {
            type: 'curvedCW',
            roundness: 0.15,
          },
          length: 120,
        },
        layout: {
          hierarchical: false,
          randomSeed: 42,
        },
      }

      if (network.value) {
        try {
          network.value.destroy()
        } catch (error) {}
      }

      network.value = new Network(
        networkContainer.value,
        { nodes, edges },
        optimizedNetworkOptions
      )
      setupEventListeners()
      setTimeout(resetZoom, 100)
    } catch (error) {}
  }

  const resetGraph = () => {
    initializeNetwork(props.graphData, props.graphSettings)
  }

  const setupEventListeners = () => {
    if (!network.value) return

    network.value.on('click', (params) => {
      if (params.nodes.length > 0) {
        const entityId = params.nodes[0]
        const entityData = currentGraphData.value.nodes.find(
          (n) => n.id === entityId
        )
        if (entityData) {
          bus.emit('entity-selected', entityData)
          const canvasPosition = network.value.canvasToDOM(
            params.pointer.canvas
          )
          closeEdgeCard()
          showNodeInfo(entityData, { x: canvasPosition.x, y: canvasPosition.y })
        }
      } else if (params.edges.length > 0) {
        const edgeId = params.edges[0]
        const edges = network.value.body.data.edges
        const edgeData = edges.get(edgeId)

        if (edgeData && edgeData.originalData) {
          const canvasPosition = network.value.canvasToDOM(
            params.pointer.canvas
          )
          closeNodeCard()

          showEdgeInfo(edgeData.originalData, {
            x: canvasPosition.x,
            y: canvasPosition.y,
          })
        }
      } else {
        closeEdgeCard()
        closeNodeCard()
        bus.emit('entity-deselected')
      }
    })

    network.value.on('deselectNode', () => {
      bus.emit('entity-deselected')
    })

    network.value.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        focusOnEntity(params.nodes[0])
      }
    })
  }

  const zoomIn = () => {
    if (network.value) {
      const scale = network.value.getScale()
      network.value.moveTo({
        scale: Math.min(scale * 1.3, 3.0),
        animation: { duration: 300 },
      })
    }
  }

  const zoomOut = () => {
    if (network.value) {
      const scale = network.value.getScale()
      network.value.moveTo({
        scale: Math.max(scale * 0.7, 0.1),
        animation: { duration: 300 },
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
            animation: { duration: 800 },
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
          animation: { duration: 800 },
        })

        setTimeout(() => {
          try {
            network.value.setSelection({ nodes: [entityId], edges: [] })
          } catch (error) {}
        }, 850)
      } catch (error) {}
    }
  }

  // Watch for changes in props to re-initialize the network
  watch(
    () => props.graphData,
    (newGraphData) => {
      if (newGraphData && newGraphData.nodes.length > 0) {
        nextTick(() => {
          initializeNetwork(newGraphData, props.graphSettings)
        })
      }
    },
    { deep: true, immediate: true }
  )

  watch(
    () => props.graphSettings,
    (newGraphSettings) => {
      if (network.value) {
        network.value.setOptions({
          nodes: {
            size: getEntitySize,
            font: { size: newGraphSettings.showLabels ? 14 : 0 },
          },
          edges: {
            width: newGraphSettings.edgeWidth,
            font: { size: newGraphSettings.showLabels ? 10 : 0 },
          },
          interaction: {
            tooltipDelay: newGraphSettings.showLabels ? 200 : 0,
          },
          physics: { enabled: newGraphSettings.physics },
        })
      }
    },
    { deep: true }
  )

  onBeforeUnmount(() => {
    if (network.value) {
      try {
        network.value.destroy()
      } catch (error) {}
    }
    // Remove bus listeners
    bus.off('search-keyword', debouncedSearch)
    bus.off('focus-node', focusOnEntity)
  })

  // Listen for external search and focus events
  bus.on('search-keyword', debouncedSearch)
  bus.on('focus-node', focusOnEntity)

  return {
    network,
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
    handleSearch,
  }
}
