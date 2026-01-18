<template>
  <el-drawer
    v-model="drawerVisible"
    title="边详情"
    :size="500"
    direction="rtl"
    :before-close="handleClose"
  >
    <div v-if="edge" class="edge-info">
      <!-- 边的基本信息 -->
      <el-card shadow="never" class="info-section">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>
        
        <div class="info-item">
          <span class="label">源实体:</span>
          <div class="entity-info">
            <span class="entity-name">{{ sourceEntityName }}</span>
            <el-tag :type="getEntityTypeTagType(sourceEntityType)" size="small">
              {{ getEntityTypeDisplay(sourceEntityType) }}
            </el-tag>
          </div>
        </div>

        <div class="info-item">
          <span class="label">目标实体:</span>
          <div class="entity-info">
            <span class="entity-name">{{ targetEntityName }}</span>
            <el-tag :type="getEntityTypeTagType(targetEntityType)" size="small">
              {{ getEntityTypeDisplay(targetEntityType) }}
            </el-tag>
          </div>
        </div>

        <div class="info-item">
          <span class="label">关系数:</span>
          <el-tag size="small">{{ relationCount }}</el-tag>
        </div>
      </el-card>

      <!-- 关系列表 -->
      <el-card shadow="never" class="info-section">
        <template #header>
          <span class="section-title">关系列表 ({{ relationCount }})</span>
        </template>
        
        <div class="relations-list">
          <div
            v-for="(relation, index) in relationsList"
            :key="relation.id || index"
            class="relation-item"
          >
            <div class="relation-header">
              <el-tag :type="getRelationTypeTagType(relation.relation_type)" size="small">
                {{ getRelationTypeDisplay(relation.relation_type) }}
              </el-tag>
              <el-tag v-if="relation.is_modified" type="warning" size="small">
                已修改
              </el-tag>
            </div>

            <div v-if="relation.description" class="relation-description">
              {{ relation.description }}
            </div>

            <div 
              v-if="relation.literature" 
              class="relation-literature clickable"
              @click="viewLiterature(relation.literature.id)"
            >
              <el-icon><Document /></el-icon>
              <span>{{ relation.literature.title || `文献 #${relation.literature.id}` }}</span>
            </div>

            <div v-if="relation.created_at" class="relation-meta">
              <span class="meta-text">创建时间: {{ formatDate(relation.created_at) }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </el-drawer>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Document } from '@element-plus/icons-vue'

export default {
  name: 'EdgeInfo',
  components: {
    Document,
  },
  props: {
    edge: {
      type: Object,
      default: null,
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const router = useRouter()
    const drawerVisible = computed({
      get: () => props.visible,
      set: () => {
        // 关闭事件由 before-close 处理
      },
    })

    const edgeData = computed(() => props.edge || {})

    const sourceEntityName = computed(() => {
      return edgeData.value.source_entity?.canonical_name || '未知'
    })

    const targetEntityName = computed(() => {
      return edgeData.value.target_entity?.canonical_name || '未知'
    })

    const sourceEntityType = computed(() => {
      return edgeData.value.source_entity?.entity_type || ''
    })

    const targetEntityType = computed(() => {
      return edgeData.value.target_entity?.entity_type || ''
    })

    const relationCount = computed(() => {
      return edgeData.value.relations?.length || edgeData.value.statistics?.total_relations || 0
    })

    const relationsList = computed(() => {
      return edgeData.value.relations || []
    })

    const handleClose = (done) => {
      emit('close')
      if (done) done()
    }

    const getEntityTypeDisplay = (type) => {
      const types = {
        'DISEASE': '疾病',
        'CELL': '细胞',
        'PATHOGEN': '病原体',
      }
      return types[type] || type
    }

    const getEntityTypeTagType = (type) => {
      const tagTypes = {
        'DISEASE': 'danger',
        'CELL': 'primary',
        'PATHOGEN': 'success',
      }
      return tagTypes[type] || ''
    }

    const getRelationTypeDisplay = (type) => {
      const types = {
        'POSITIVE_CORRELATION': '正相关',
        'NEGATIVE_CORRELATION': '负相关',
        'ASSOCIATION': '关联',
        'INTERACTION': '交互',
      }
      return types[type] || type
    }

    const getRelationTypeTagType = (type) => {
      // 可以根据关系类型返回不同的 tag type
      return 'info'
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN')
      } catch (e) {
        return dateString
      }
    }

    const viewLiterature = (id) => {
      if (id) {
        router.push({
          name: 'literature-detail',
          params: { id },
        })
      }
    }

    return {
      drawerVisible,
      edgeData,
      sourceEntityName,
      targetEntityName,
      sourceEntityType,
      targetEntityType,
      relationCount,
      relationsList,
      handleClose,
      getEntityTypeDisplay,
      getEntityTypeTagType,
      getRelationTypeDisplay,
      getRelationTypeTagType,
      formatDate,
      viewLiterature,
    }
  },
}
</script>

<style scoped>
.edge-info {
  padding: 8px 0;
}

.info-section {
  margin-bottom: 16px;
}

.info-section :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.info-section :deep(.el-card__body) {
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-item {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.entity-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.entity-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.relations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.relation-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #1a91c1;
}

.relation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.relation-description {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.6;
}

.relation-literature {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1a91c1;
  margin-bottom: 6px;
}

.relation-literature.clickable {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.relation-literature.clickable:hover {
  background-color: #e6f7ff;
  color: #096dd9;
}

.relation-meta {
  font-size: 12px;
  color: #999;
}

.meta-text {
  display: block;
}
</style>
