// src/composables/useGraphData.js
import { ref, watch } from 'vue'
import KnowledgeGraph from '@/api/knowledgeGraph'

export function useGraphData() {
  const internalGraphData = ref({ nodes: [], edges: [] })
  const isLoading = ref(false)

  const processApiResponse = (apiData) => {
    let processedNodes = apiData.nodes || []
    let processedEdges = []

    if (apiData.edges && Array.isArray(apiData.edges)) {
      apiData.edges.forEach((aggregatedEdge) => {
        if (
          aggregatedEdge &&
          aggregatedEdge.source_entity &&
          aggregatedEdge.target_entity
        ) {
          processedEdges.push({
            id: `${aggregatedEdge.source_entity.id}-${aggregatedEdge.target_entity.id}`,
            from: aggregatedEdge.source_entity.id,
            to: aggregatedEdge.target_entity.id,

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
