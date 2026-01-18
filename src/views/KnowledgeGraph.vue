<template>
  <div class="knowledge-graph-page">
    <!-- 头部 -->
    <section class="graph-header">
      <div class="header-content">
        <div class="header-text">
          <h1>知识图谱</h1>
          <p>展现疾病、细胞、病原体之间的关系</p>
        </div>
        
        <!-- 审核按钮 -->
        <button 
          v-if="isAdmin || true" 
          @click="showReviewCard = true" 
          class="review-btn"
        >
          <el-icon><Document /></el-icon>
          <span>审核记录</span>
          <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="graph-search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索疾病、细胞或病原体..."
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClearSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button 
          type="primary" 
          @click="handleSearch"
          :loading="isSearching"
          class="search-btn"
        >
          搜索
        </el-button>
      </div>
    </section>

    <!-- 主内容区 -->
    <div class="container">
      <div class="graph-content">
        <GraphSidebar 
          :graph-settings="graphSettings" 
          @settings-change="handleSettingsChange"
        />

        <div class="graph-main">
          <GraphVisualization 
            ref="graphVisualizationRef"
            :nodes="graphNodes"
            :edges="graphEdges"
            :is-loading="isLoading"
            @node-click="handleNodeClick"
            @edge-click="handleEdgeClick"
          />
        </div>
      </div>
    </div>

    <SiteFooter />

    <!-- 节点详情卡片 -->
    <NodeInfo
      v-if="selectedNode"
      :node="selectedNode"
      :visible="!!selectedNode"
      @close="selectedNode = null"
      @expand="handleExpandNode"
    />

    <!-- 边详情卡片 -->
    <EdgeInfo
      v-if="selectedEdge"
      :edge="selectedEdge"
      :visible="!!selectedEdge"
      @close="selectedEdge = null"
    />

    <!-- 审核卡片 -->
    <ReviewCard
      :visible="showReviewCard"
      :is-admin="isAdmin"
      @close="showReviewCard = false"
      @updated="handleReviewUpdated"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { Search, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import KnowledgeGraph from '@/api/knowledgeGraph'
import bus from '@/utils/bus'
import GraphSidebar from '@/components/knowledge/GraphSidebar.vue'
import GraphVisualization from '@/components/knowledge/GraphVisualization.vue'
import NodeInfo from '@/components/knowledge/NodeInfo.vue'
import EdgeInfo from '@/components/knowledge/EdgeInfo.vue'
import ReviewCard from '@/components/knowledge/ReviewCard.vue'
import SiteFooter from '@/components/navigation/SiteFooter.vue'

export default {
  name: 'KnowledgeGraph',
  components: {
    GraphSidebar,
    GraphVisualization,
    NodeInfo,
    EdgeInfo,
    ReviewCard,
    SiteFooter,
    Search,
    Document,
  },
  setup() {
    const store = useStore()
    const isAdmin = computed(() => store.getters.isAdmin)

    const searchKeyword = ref('')
    const isSearching = ref(false)
    const isLoading = ref(false)
    const showReviewCard = ref(false)
    const pendingCount = ref(0)

    // 图谱数据
    const graphNodes = ref([])
    const graphEdges = ref([])
    const nodesMap = new Map() // 用于快速查找节点，避免重复
    const edgesMap = new Map() // 用于快速查找边

    // 选中的节点和边
    const selectedNode = ref(null)
    const selectedEdge = ref(null)
    const graphVisualizationRef = ref(null)

    // 图谱设置
    const graphSettings = reactive({
      nodeSize: 12,
      edgeWidth: 2,
      showLabels: true,
      physics: true,
    })

    // 首次加载 - 只显示疾病和细胞
    const loadOverview = async () => {
      isLoading.value = true
      try {
        const response = await KnowledgeGraph.graphOverview({
          entity_type: '', // 空字符串表示不筛选，但后端会返回所有类型
        })
        
        if (response.data && response.data.data) {
          const data = response.data.data
          
          // 过滤掉病原体，只显示疾病和细胞
          const filteredNodes = (data.nodes || []).filter(
            node => node.entity_type === 'DISEASE' || node.entity_type === 'CELL'
          )
          
          // 只保留连接过滤后节点的边
          const filteredNodeIds = new Set(filteredNodes.map(n => n.id))
          const filteredEdges = (data.edges || []).filter(
            edge => filteredNodeIds.has(edge.source_id) && filteredNodeIds.has(edge.target_id)
          )

          graphNodes.value = filteredNodes.map(transformNode)
          graphEdges.value = filteredEdges.map((edge, index) => transformEdge(edge, index))

          // 更新节点和边的映射
          updateMaps(filteredNodes, filteredEdges)
        }
      } catch (error) {
        console.error('加载概览失败:', error)
        ElMessage.error('加载图谱数据失败')
      } finally {
        isLoading.value = false
      }
    }

    // 搜索实体
    const handleSearch = async () => {
      if (!searchKeyword.value.trim()) {
        return
      }

      isSearching.value = true
      selectedNode.value = null
      selectedEdge.value = null

      try {
        const response = await KnowledgeGraph.searchEntities(searchKeyword.value.trim())
        
        if (response.data && response.data.data) {
          const data = response.data.data
          const matchedIds = data.matched_ids || []
          
          // 清空旧数据
          graphNodes.value = []
          graphEdges.value = []
          nodesMap.clear()
          edgesMap.clear()
          
          // 设置新数据 - 确保创建新数组以触发响应式
          const transformedNodes = (data.nodes || []).map(transformNode)
          const transformedEdges = (data.edges || []).map((edge, index) => transformEdge(edge, index))
          
          graphNodes.value = transformedNodes
          graphEdges.value = transformedEdges
          updateMaps(data.nodes || [], data.edges || [])
          
          // 确保数据更新后触发重新布局和聚焦
          await nextTick()
          setTimeout(() => {
            if (graphVisualizationRef.value) {
              // 重新布局
              if (graphVisualizationRef.value.relayout) {
                graphVisualizationRef.value.relayout()
              }
              // 聚焦到匹配的节点
              if (matchedIds.length > 0 && graphVisualizationRef.value.focusNode) {
                setTimeout(() => {
                  graphVisualizationRef.value.focusNode(matchedIds[0])
                }, 1500) // 等待布局稳定后聚焦
              }
            }
          }, 200)
        }
      } catch (error) {
        console.error('搜索失败:', error)
        ElMessage.error('搜索失败')
      } finally {
        isSearching.value = false
      }
    }

    // 清除搜索，恢复概览
    const handleClearSearch = () => {
      if (!searchKeyword.value) {
        loadOverview()
      }
    }

    // 点击节点
    const handleNodeClick = async (node) => {
      selectedEdge.value = null
      selectedNode.value = node

      // 如果节点已展开，不再重复展开
      if (node.expanded) {
        return
      }
    }

    // 展开节点 - 加载病原体相关数据
    const handleExpandNode = async (node) => {
      if (node.expanded) {
        return
      }

      try {
        const response = await KnowledgeGraph.expandEntity(node.id)
        
        if (response.data && response.data.data) {
          const data = response.data.data
          const newNodes = (data.new_nodes || []).map(transformNode)
          const newEdges = (data.edges || []).map((edge, index) => transformEdge(edge, index))

          // 合并新节点（避免重复）
          newNodes.forEach(newNode => {
            if (!nodesMap.has(newNode.id)) {
              graphNodes.value.push(newNode)
              nodesMap.set(newNode.id, newNode)
            }
          })

          // 合并新边（避免重复）
          newEdges.forEach(newEdge => {
            // 使用边的ID作为key，因为ID已经包含关系类型确保唯一性
            const edgeKey = newEdge.id
            if (!edgesMap.has(edgeKey)) {
              graphEdges.value.push(newEdge)
              edgesMap.set(edgeKey, newEdge)
            }
          })

          // 标记节点已展开
          node.expanded = true
          const nodeInMap = nodesMap.get(node.id)
          if (nodeInMap) {
            nodeInMap.expanded = true
          }

          // 强制触发响应式更新 - 创建新数组触发Vue响应式
          graphNodes.value = [...graphNodes.value]
          graphEdges.value = [...graphEdges.value]

          // 重新布局 - 延迟一点确保数据已更新
          nextTick(() => {
            if (graphVisualizationRef.value && graphVisualizationRef.value.relayout) {
              graphVisualizationRef.value.relayout()
            }
          })
        }
      } catch (error) {
        console.error('展开节点失败:', error)
        ElMessage.error('展开节点失败')
      }
    }

    // 点击边
    const handleEdgeClick = async (edge) => {
      selectedNode.value = null
      
      try {
        const response = await KnowledgeGraph.edgeDetails(edge.from, edge.to)
        
        if (response.data && response.data.data) {
          selectedEdge.value = response.data.data
        }
      } catch (error) {
        console.error('获取边详情失败:', error)
        ElMessage.error('获取边详情失败')
      }
    }

    // 转换节点数据格式
    const transformNode = (node) => {
      return {
        id: node.id,
        label: node.canonical_name || node.name || `节点 ${node.id}`,
        entity_type: node.entity_type,
        standard_id: node.standard_id,
        color: getNodeColor(node.entity_type),
        expanded: false,
        raw: node,
      }
    }

    // 转换边数据格式
    const transformEdge = (edge, index = 0) => {
      // 包含关系类型确保ID唯一性，因为同一节点对可能有多个关系
      const relationType = edge.relation_type || edge.first_relation_type || ''
      const sourceId = edge.source_id || edge.from
      const targetId = edge.target_id || edge.to
      // 使用关系类型和索引确保唯一性
      const edgeId = edge.id || `${sourceId}-${targetId}-${relationType}-${index}`
      
      return {
        id: edgeId,
        from: sourceId,
        to: targetId,
        label: relationType,
        relation_count: edge.relation_count || 1,
        is_modified: edge.is_modified || false,
        raw: edge,
      }
    }

    // 根据实体类型获取颜色
    const getNodeColor = (entityType) => {
      const colors = {
        'DISEASE': '#ff4d4f',  // 红色 - 疾病
        'CELL': '#40a9ff',      // 蓝色 - 细胞
        'PATHOGEN': '#73d13d',  // 绿色 - 病原体
      }
      return colors[entityType] || '#999'
    }

    // 更新节点和边的映射
    const updateMaps = (nodes, edges) => {
      nodesMap.clear()
      edgesMap.clear()
      nodes.forEach(node => {
        nodesMap.set(node.id, transformNode(node))
      })
      edges.forEach((edge, index) => {
        const transformed = transformEdge(edge, index)
        const key = `${transformed.from}-${transformed.to}-${transformed.label}`
        edgesMap.set(key, transformed)
      })
    }

    // 加载待审核数量
    const loadPendingCount = async () => {
      if (!isAdmin.value) {
        pendingCount.value = 0
        return
      }

      try {
        const response = await KnowledgeGraph.getPendingReviews()
        if (response.data && response.data.data) {
          pendingCount.value = response.data.data.count || 0
        }
      } catch (error) {
        console.error('加载待审核数量失败:', error)
      }
    }

    // 审核更新后刷新
    const handleReviewUpdated = () => {
      loadOverview()
      loadPendingCount()
    }

    // 设置变化
    const handleSettingsChange = (settings) => {
      Object.assign(graphSettings, settings)
    }

    onMounted(() => {
      loadOverview()
      loadPendingCount()
    })

    watch(isAdmin, (newVal) => {
      if (newVal) {
        loadPendingCount()
      }
    })

    return {
      isAdmin,
      searchKeyword,
      isSearching,
      isLoading,
      graphNodes,
      graphEdges,
      selectedNode,
      selectedEdge,
      showReviewCard,
      pendingCount,
      graphSettings,
      handleSearch,
      handleClearSearch,
      handleNodeClick,
      handleExpandNode,
      handleEdgeClick,
      handleReviewUpdated,
      handleSettingsChange,
    }
  },
}
</script>

<style scoped>
.knowledge-graph-page {
  min-height: 100vh;
  background-color: #f5fbff;
}

/* 头部样式 */
.graph-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 40px 5%;
  position: relative;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-text {
  flex: 1;
  text-align: center;
}

.graph-header h1 {
  color: white;
  font-size: 28px;
  margin-bottom: 10px;
}

.graph-header p {
  color: rgba(255, 255, 255, 0.9);
  max-width: 700px;
  margin: 0 auto;
}

.review-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #1a91c1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.review-btn:hover {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.review-btn .badge {
  background: #ef4444;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.graph-search-container {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
}

.graph-search-container :deep(.el-input) {
  flex: 1;
}

.search-btn {
  flex-shrink: 0;
}

.container {
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 5%;
}

.graph-content {
  display: flex;
  gap: 30px;
}

.graph-main {
  flex: 1;
  position: relative;
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .container {
    padding: 0 3%;
  }

  .graph-content {
    gap: 20px;
  }

  .review-btn {
    right: 3%;
  }
}

@media (max-width: 768px) {
  .graph-content {
    flex-direction: column;
  }

  .graph-header {
    padding: 30px 20px;
  }

  .header-content {
    flex-direction: column;
    align-items: center;
  }

  .review-btn {
    position: relative;
    top: 0;
    right: 0;
    margin-top: 16px;
  }

  .container {
    padding: 0 20px;
  }

  .graph-search-container {
    flex-direction: column;
  }
}
</style>
