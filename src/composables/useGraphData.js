// src/composables/useGraphData.js
import { ref } from 'vue'
import KnowledgeGraph from '@/api/knowledgeGraph'

export function useGraphData() {
  const internalGraphData = ref({ nodes: [], edges: [] })
  const isLoading = ref(false)
  const expandedNodes = ref(new Set()) // 记录已展开的节点
  const loadedEdgeDetails = ref(new Map()) // 记录已加载详情的边

  /**
   * 处理概览API响应 - 将后端聚合边转换为vis-network格式
   */
  const processOverviewData = (apiData) => {
    const processedNodes = apiData.nodes || []
    const processedEdges = []
    const edgeMap = new Map() // 用于去重

    if (apiData.edges && Array.isArray(apiData.edges)) {
      apiData.edges.forEach((aggregatedEdge) => {
        const edgeId = `${aggregatedEdge.source_id}-${aggregatedEdge.target_id}`
        
        // 去重：如果边已存在，跳过
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, true)
          
          processedEdges.push({
            id: edgeId,
            from: aggregatedEdge.source_id,
            to: aggregatedEdge.target_id,
            originalData: {
              source_id: aggregatedEdge.source_id,
              target_id: aggregatedEdge.target_id,
              total_count: aggregatedEdge.factor_count || 1,
              modified_manual_count: aggregatedEdge.modified_count || 0,
              factors: [{
                factor_name: aggregatedEdge.first_factor,
                effect: aggregatedEdge.first_effect,
                is_modified: aggregatedEdge.modified_count > 0
              }]
            }
          })
        }
      })
    }

    return {
      nodes: processedNodes,
      edges: processedEdges,
    }
  }

  /**
   * 处理展开API响应 - 合并新节点和边到当前图谱
   */
  const processExpandData = (expandData) => {
    const currentNodes = [...internalGraphData.value.nodes]
    const currentEdges = [...internalGraphData.value.edges]
    const existingNodeIds = new Set(currentNodes.map(n => n.id))
    const existingEdgeIds = new Set(currentEdges.map(e => e.id))

    // 添加新节点（去重）
    if (expandData.new_nodes) {
      expandData.new_nodes.forEach(node => {
        if (!existingNodeIds.has(node.id)) {
          currentNodes.push(node)
          existingNodeIds.add(node.id)
        }
      })
    }

    // 添加新边（去重）
    if (expandData.edges) {
      expandData.edges.forEach(edge => {
        const edgeId = `${edge.source_id}-${edge.target_id}`
        
        // 只有当边不存在时才添加
        if (!existingEdgeIds.has(edgeId)) {
          currentEdges.push({
            id: edgeId,
            from: edge.source_id,
            to: edge.target_id,
            originalData: {
              source_id: edge.source_id,
              target_id: edge.target_id,
              total_count: 1,
              modified_manual_count: edge.modified_count || 0,
              factors: [{
                factor_name: edge.first_factor,
                effect: edge.first_effect,
                is_modified: edge.modified_count > 0
              }]
            }
          })
          existingEdgeIds.add(edgeId)
        }
      })
    }

    return { nodes: currentNodes, edges: currentEdges }
  }

  /**
   * 处理搜索API响应 - 替换当前图谱为搜索结果
   */
  const processSearchData = (searchData) => {
    const processedNodes = searchData.nodes || []
    const processedEdges = []
    const edgeMap = new Map() // 用于去重

    if (searchData.edges && Array.isArray(searchData.edges)) {
      searchData.edges.forEach((edge) => {
        const edgeId = `${edge.source_id}-${edge.target_id}`
        
        // 去重：如果边已存在，跳过
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, true)
          
          processedEdges.push({
            id: edgeId,
            from: edge.source_id,
            to: edge.target_id,
            originalData: {
              source_id: edge.source_id,
              target_id: edge.target_id,
              total_count: 1,
              modified_manual_count: 0,
              factors: [{
                factor_name: edge.first_factor,
                effect: edge.first_effect,
                is_modified: false
              }]
            }
          })
        }
      })
    }

    return {
      nodes: processedNodes,
      edges: processedEdges,
      matchedIds: searchData.matched_ids || []
    }
  }

  /**
   * 初始加载 - 使用 overview 接口加载 Level 1-2 节点
   */
  const loadGraphData = async (filters = {}) => {
    isLoading.value = true
    try {
      const response = await KnowledgeGraph.graphOverview(filters)
      
      if (response.data.data) {
        const processedData = processOverviewData(response.data.data)
        internalGraphData.value = processedData
        
        // 清空展开记录
        expandedNodes.value.clear()
        loadedEdgeDetails.value.clear()
        
        console.log('✅ 概览加载完成:', {
          nodes: processedData.nodes.length,
          edges: processedData.edges.length,
          cached: response.data.cached
        })
      }
    } catch (error) {
      console.error('❌ 加载图谱概览失败:', error)
      internalGraphData.value = { nodes: [], edges: [] }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 展开节点 - 加载指定节点关联的 Level 3 节点
   */
  const expandNode = async (entityId) => {
    // 防止重复展开
    if (expandedNodes.value.has(entityId)) {
      console.log('⚠️ 节点已展开:', entityId)
      return
    }

    isLoading.value = true
    try {
      const response = await KnowledgeGraph.expandEntity(entityId)
      
      if (response.data.data) {
        const expandData = response.data.data
        const mergedData = processExpandData(expandData)
        internalGraphData.value = mergedData
        
        // 标记为已展开
        expandedNodes.value.add(entityId)
        
        console.log('✅ 节点展开完成:', {
          entityId,
          newNodes: expandData.new_nodes?.length || 0,
          newEdges: expandData.edges?.length || 0,
          cached: response.data.cached
        })
        
        return mergedData
      }
    } catch (error) {
      console.error('❌ 展开节点失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载边详情 - 获取指定边的所有 factors
   */
  const loadEdgeDetails = async (sourceId, targetId) => {
    const edgeKey = `${sourceId}-${targetId}`
    
    // 检查是否已加载
    if (loadedEdgeDetails.value.has(edgeKey)) {
      return loadedEdgeDetails.value.get(edgeKey)
    }

    try {
      const response = await KnowledgeGraph.edgeDetails(sourceId, targetId)
      
      if (response.data.data) {
        const edgeData = response.data.data
        
        // 缓存详情数据
        loadedEdgeDetails.value.set(edgeKey, edgeData)
        
        console.log('✅ 边详情加载完成:', {
          edge: edgeKey,
          factors: edgeData.factors?.length || 0,
          cached: response.data.cached
        })
        
        return edgeData
      }
    } catch (error) {
      console.error('❌ 加载边详情失败:', error)
      return null
    }
  }

  /**
   * 搜索实体 - 返回匹配的子图
   */
  const searchGraph = async (keyword) => {
    if (!keyword || !keyword.trim()) {
      // 关键词为空，重新加载概览
      await loadGraphData()
      return null
    }

    isLoading.value = true
    try {
      console.log('🔍 开始搜索:', keyword)
      const response = await KnowledgeGraph.searchEntities(keyword.trim())
      
      console.log('📦 搜索响应:', response.data)
      
      if (response.data.data) {
        const searchData = response.data.data
        const processedData = processSearchData(searchData)
        
        console.log('✅ 搜索结果:', {
          keyword,
          matches: searchData.statistics?.total_matches || 0,
          nodes: processedData.nodes.length,
          edges: processedData.edges.length,
          matchedIds: processedData.matchedIds,
          cached: response.data.cached
        })
        
        // 更新图谱数据
        internalGraphData.value = processedData
        
        return processedData.matchedIds
      }
    } catch (error) {
      console.error('❌ 搜索失败:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 重置图谱 - 清空所有数据并重新加载概览
   */
  const resetGraph = async () => {
    expandedNodes.value.clear()
    loadedEdgeDetails.value.clear()
    await loadGraphData()
  }

  // 初始加载
  loadGraphData()

  return {
    graphData: internalGraphData,
    isLoading,
    expandedNodes,
    loadGraphData,
    expandNode,
    loadEdgeDetails,
    searchGraph,
    resetGraph,
  }
}