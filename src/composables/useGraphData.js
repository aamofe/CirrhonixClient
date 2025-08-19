// src/composables/useGraphData.js
import { ref, watch } from 'vue'
import KnowledgeGraph from '@/api/knowledgeGraph' // Assuming this path is correct

export function useGraphData() {
  const internalGraphData = ref({ nodes: [], edges: [] })
  const isLoading = ref(false)

  // 处理API返回的嵌套数组数据
  const processApiResponse = (apiData) => {
    let processedNodes = []
    let processedEdges = []

    // 处理nodes - 检查是否为嵌套数组
    if (apiData.nodes && Array.isArray(apiData.nodes)) {
      if (apiData.nodes.length > 0 && Array.isArray(apiData.nodes[0])) {
        // 嵌套数组，需要展平
        processedNodes = apiData.nodes.flat()
      } else {
        // 普通数组
        processedNodes = apiData.nodes
      }
    }

    // 处理edges - 检查是否为嵌套数组
    if (apiData.edges && Array.isArray(apiData.edges)) {
      if (apiData.edges.length > 0 && Array.isArray(apiData.edges[0])) {
        // 嵌套数组，需要展平
        processedEdges = apiData.edges.flat()
      } else {
        // 普通数组
        processedEdges = apiData.edges
      }
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
        limit: 500, // Or whatever default limit you need
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

  // Initial load
  loadGraphData()

  return {
    graphData: internalGraphData,
    isLoading,
    loadGraphData, // Expose if you need to manually trigger reload
  }
}
