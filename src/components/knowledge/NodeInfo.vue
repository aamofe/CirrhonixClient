<template>
  <el-drawer
    v-model="drawerVisible"
    title="节点详情"
    :size="400"
    direction="rtl"
    :before-close="handleClose"
  >
    <div v-if="node" class="node-info">
      <!-- 基本信息 -->
      <el-card shadow="never" class="info-section">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>
        
        <div class="info-item">
          <span class="label">名称:</span>
          <span class="value">{{ node.label || node.canonical_name || '-' }}</span>
        </div>

        <div class="info-item">
          <span class="label">类型:</span>
          <el-tag :type="getEntityTypeTagType(node.entity_type || node.raw?.entity_type)" size="small">
            {{ getEntityTypeDisplay(node.entity_type || node.raw?.entity_type) }}
          </el-tag>
        </div>

        <div v-if="node.standard_id" class="info-item">
          <span class="label">标准ID:</span>
          <span class="value">{{ node.standard_id }}</span>
        </div>

        <div v-if="node.abbreviation" class="info-item">
          <span class="label">缩写:</span>
          <span class="value">{{ node.abbreviation }}</span>
        </div>
      </el-card>

      <!-- 展开操作 -->
      <el-card shadow="never" class="info-section">
        <template #header>
          <span class="section-title">操作</span>
        </template>
        
        <el-button
          type="primary"
          :disabled="node.expanded"
          @click="handleExpand"
          style="width: 100%"
        >
          <el-icon><Plus /></el-icon>
          <span>{{ node.expanded ? '已展开' : '展开节点' }}</span>
        </el-button>
        
        <div v-if="node.expanded" class="expand-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>已展开相关病原体节点</span>
        </div>
      </el-card>

      <!-- 详细信息（如果有） -->
      <el-card v-if="nodeRaw && (nodeRaw.description || nodeRaw.abbreviation)" shadow="never" class="info-section">
        <template #header>
          <span class="section-title">详细信息</span>
        </template>
        
        <div v-if="nodeRaw.description" class="info-item">
          <span class="label">描述:</span>
          <div class="value">{{ nodeRaw.description }}</div>
        </div>
      </el-card>
    </div>
  </el-drawer>
</template>

<script>
import { computed } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'

export default {
  name: 'NodeInfo',
  components: {
    Plus,
    InfoFilled,
  },
  props: {
    node: {
      type: Object,
      default: null,
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'expand'],
  setup(props, { emit }) {
    const drawerVisible = computed({
      get: () => props.visible,
      set: (val) => {
        if (!val) {
          emit('close')
        }
      },
    })

    const nodeRaw = computed(() => props.node?.raw || props.node)

    const handleClose = () => {
      emit('close')
    }

    const handleExpand = () => {
      emit('expand', props.node)
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

    return {
      drawerVisible,
      nodeRaw,
      handleClose,
      handleExpand,
      getEntityTypeDisplay,
      getEntityTypeTagType,
    }
  },
}
</script>

<style scoped>
.node-info {
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

.value {
  font-size: 14px;
  color: #333;
  word-break: break-word;
}

.expand-hint {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a91c1;
  font-size: 13px;
}
</style>
