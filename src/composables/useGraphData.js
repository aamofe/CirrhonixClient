// src/composables/useGraphData.js
import { ref, watch } from 'vue'
import KnowledgeGraph from '@/api/knowledgeGraph'

export function useGraphData() {
  const internalGraphData = ref({ nodes: [], edges: [] })
  const isLoading = ref(false)

  // 处理API返回数据，直接使用聚合后的edges
  const processApiResponse = (apiData) => {
    let processedNodes = apiData.nodes || []
    let processedEdges = []

    if (apiData.edges && Array.isArray(apiData.edges)) {
      apiData.edges.forEach((aggregatedEdge) => {
        // 如果aggregatedEdge有效，创建一个vis.js的edge对象
        if (
          aggregatedEdge &&
          aggregatedEdge.source_entity &&
          aggregatedEdge.target_entity
        ) {
          processedEdges.push({
            // 使用一个唯一的组合ID来确保唯一性，例如：源节点ID-目标节点ID
            id: `${aggregatedEdge.source_entity.id}-${aggregatedEdge.target_entity.id}`,
            from: aggregatedEdge.source_entity.id,
            to: aggregatedEdge.target_entity.id,
            // 将整个聚合后的对象作为originalData存储，方便后续访问所有关系
            originalData: aggregatedEdge,
          })
        }
      })
    }

    return {
      nodes: processedNodes,
      edges: processedEdges,
    }
  }

  // 加载数据
  const loadGraphData = async () => {
    isLoading.value = true
    try {
      const params = {
        limit: 500,
      }
      const response = await KnowledgeGraph.getGraph(params)
      if (response.data.data) {
        const processedData = processApiResponse(response.data.data)
        internalGraphData.value = processedData
      }
    } catch (error) {
      console.error('加载图谱数据失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  loadGraphData()

  return {
    graphData: internalGraphData,
    isLoading,
    loadGraphData,
  }
}
