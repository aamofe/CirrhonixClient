<template>
  <div class="knowledge-graph">
    <!-- 统一的头部样式 -->
    <section class="graph-header">
      <div class="header-content">
        <div class="header-text">
          <h1>知识图谱</h1>
          <p>展现最新的病原体、细胞、分子之间的关系</p>
        </div>
        
        <!-- 修改记录按钮 - 使用SVG图标 -->
        <button @click="showReviewCard = true" class="review-btn">
          <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zM668 345.9L621.5 312 572 347.4V124h96v221.9z m104 448.7c0 4.4-3.6 8-8 8H260c-4.4 0-8-3.6-8-8V779.5c0-4.4 3.6-8 8-8h504c4.4 0 8 3.6 8 8v15.1z m0-136.5c0 4.4-3.6 8-8 8H260c-4.4 0-8-3.6-8-8v-15.1c0-4.4 3.6-8 8-8h504c4.4 0 8 3.6 8 8v15.1z m0-136.5c0 4.4-3.6 8-8 8H260c-4.4 0-8-3.6-8-8v-15.1c0-4.4 3.6-8 8-8h504c4.4 0 8 3.6 8 8v15.1z" fill="currentColor"/>
          </svg>
          <span>修改记录</span>
          <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
        </button>
      </div>

      <!-- 搜索框移到头部 -->
      <div class="graph-search-container">
        <input type="text" v-model="globalState.searchKeyword" @input="handleSearchKeywordChange($event.target.value)"
          placeholder="搜索节点..." class="graph-search-input" />
      </div>
    </section>

    <div class="container">
      <div class="graph-container">
        <GraphSidebar :graph-settings="globalState.graphSettings" @settings-change="handleSettingsChange"
          @reset-settings="handleResetSettings" />

        <div class="graph-main">
          <GraphVisualization :graph-data="graphData" :graph-settings="globalState.graphSettings"
            :is-loading="isLoading" />
        </div>
      </div>
    </div>

    <SiteFooter />

    <!-- 修改记录卡片 -->
    <ReviewCard :visible="showReviewCard" @close="showReviewCard = false" @updated="handleReviewUpdated" />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useStore } from 'vuex'
import { useGraphData } from '@/composables/useGraphData'
import KnowledgeGraph from '@/api/knowledgeGraph'
import bus from '@/utils/bus'
import GraphSidebar from '@/components/knowledge/GraphSidebar.vue'
import GraphVisualization from '@/components/knowledge/GraphVisualization.vue'
import ReviewCard from '@/components/knowledge/ReviewCard.vue'
import SiteFooter from '@/components/navigation/SiteFooter.vue'

export default {
  name: 'KnowledgeGraph',
  components: {
    GraphSidebar,
    GraphVisualization,
    ReviewCard,
    SiteFooter,
  },
  setup() {
    const store = useStore()
    const isAdmin = computed(() => store.getters.isAdmin)

    const globalState = reactive({
      searchKeyword: '',
      selectedEntity: null,
      graphSettings: {
        nodeSize: 10,
        edgeWidth: 2,
        showLabels: true,
        physics: true,
      }
    })

    const { graphData, isLoading, loadGraphData } = useGraphData()
    const showReviewCard = ref(false)
    const pendingCount = ref(0)

    // 先定义 loadPendingCount 函数
    const loadPendingCount = async () => {
      console.log('loadPendingCount 被调用, isAdmin:', isAdmin.value)
      
      if (!isAdmin.value) {
        pendingCount.value = 0
        return
      }
      
      try {
        const res = await KnowledgeGraph.getPendingReviews()
        pendingCount.value = res.data?.length || 0
        console.log('待审核数量:', pendingCount.value)
      } catch (error) {
        console.error('加载待审核数量失败:', error)
        pendingCount.value = 0
      }
    }

    const handleEntitySelected = (entity) => {
      globalState.selectedEntity = entity
    }

    const handleEntityDeselected = () => {
      globalState.selectedEntity = null
    }

    const handleGraphUpdated = () => {
      loadGraphData()
      loadPendingCount()
    }

    const handleReviewUpdated = () => {
      loadGraphData()
      loadPendingCount()
    }

    const handleSearchKeywordChange = (keyword) => {
      globalState.searchKeyword = keyword
      bus.emit('search-keyword', keyword)
    }

    const handleSettingsChange = (settings) => {
      Object.assign(globalState.graphSettings, settings)
    }

    const handleResetSettings = () => {
      globalState.graphSettings = {
        nodeSize: 10,
        edgeWidth: 2,
        showLabels: true,
        physics: true,
      }
    }

    // 监听 isAdmin 的变化，用于调试
    watch(isAdmin, (newVal) => {
      console.log('知识图谱页面 - isAdmin 变化:', newVal)
      if (newVal) {
        loadPendingCount()
      }
    }, { immediate: true })

    // Bus event listeners
    onMounted(() => {
      console.log('知识图谱页面已挂载, isAdmin:', isAdmin.value)
      bus.on('entity-selected', handleEntitySelected)
      bus.on('entity-deselected', handleEntityDeselected)
      bus.on('graph-updated', handleGraphUpdated)
      
      // 延迟加载，确保 store 已更新
      setTimeout(() => {
        loadPendingCount()
      }, 100)
    })

    onBeforeUnmount(() => {
      bus.off('entity-selected', handleEntitySelected)
      bus.off('entity-deselected', handleEntityDeselected)
      bus.off('graph-updated', handleGraphUpdated)
    })

    return {
      globalState,
      graphData,
      isLoading,
      showReviewCard,
      pendingCount,
      isAdmin,
      handleSearchKeywordChange,
      handleSettingsChange,
      handleResetSettings,
      handleReviewUpdated,
    }
  },
}
</script>

<style scoped>
.knowledge-graph {
  background-color: #f5fbff;
  min-height: 100vh;
  position: relative;
}

/* 统一的头部样式 - 参考 LiteratureListPage */
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
  position: absolute;
  top: 40px;
  right: 5%;
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

.review-btn .icon {
  flex-shrink: 0;
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
  max-width: 400px;
  margin: 0 auto;
}

.graph-search-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.graph-search-input:focus {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.container {
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 5%;
}

.graph-container {
  display: flex;
  gap: 30px;
}

.graph-main {
  flex: 1;
  position: relative;
  min-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .container {
    padding: 0 3%;
  }

  .graph-container {
    gap: 20px;
  }

  .review-btn {
    right: 3%;
  }
}

@media (max-width: 768px) {
  .graph-container {
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
}
</style>