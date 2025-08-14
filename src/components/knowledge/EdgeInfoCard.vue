<template>
  <div v-if="visible" class="edge-info-card" :style="{ left: position.x + 'px', top: position.y + 'px' }" @click.stop>
    <div class="card-header">
      <h3 class="card-title">关系详情</h3>
      <div class="header-actions">
        <el-popconfirm title="确定要删除这个关系吗？" confirm-button-text="确定" cancel-button-text="取消" icon="el-icon-info"
          icon-color="#f56c6c" @confirm="handleDelete">
          <template #reference>
            <button class="delete-btn" :disabled="deleting">
              <el-icon v-if="!deleting">
                <Delete />
              </el-icon>
              <el-icon v-else class="loading">
                <Loading />
              </el-icon>
            </button>
          </template>
        </el-popconfirm>
        <button @click="close" class="close-btn">
          <el-icon>
            <Close />
          </el-icon>
        </button>
      </div>
    </div>

    <div class="card-content">
      <!-- 关系信息 -->
      <div class="section">
        <div class="section-title">关系信息</div>
        <div class="relation-flow">
          <div class="entity-box source">
            <div class="entity-name">{{ edgeData.source_entity.name }}</div>
            <div class="entity-meta">
              <span class="level-badge" :class="`level-${edgeData.source_entity.level}`">
                Level {{ edgeData.source_entity.level }}
              </span>
              <span v-if="edgeData.source_entity.entity_type" class="entity-type">
                {{ edgeData.source_entity.entity_type }}
              </span>
            </div>
            <div v-if="edgeData.source_entity.subtype" class="entity-subtype">
              {{ edgeData.source_entity.subtype }}
            </div>
          </div>

          <div class="arrow-container">
            <div class="factor-info">
              <div class="factor-name">{{ edgeData.factor.factor_name }}</div>
              <div class="factor-type">{{ edgeData.factor.factor_type }}</div>
            </div>
            <div class="arrow">→</div>
          </div>

          <div class="entity-box target">
            <div class="entity-name">{{ edgeData.target_entity.name }}</div>
            <div class="entity-meta">
              <span class="level-badge" :class="`level-${edgeData.target_entity.level}`">
                Level {{ edgeData.target_entity.level }}
              </span>
              <span v-if="edgeData.target_entity.entity_type" class="entity-type">
                {{ edgeData.target_entity.entity_type }}
              </span>
            </div>
            <div v-if="edgeData.target_entity.subtype" class="entity-subtype">
              {{ edgeData.target_entity.subtype }}
            </div>
          </div>
        </div>
      </div>

      <!-- 影响因子详情 -->
      <div class="section">
        <div class="section-title">影响因子</div>
        <div class="factor-details">
          <div class="factor-item">
            <span class="label">因子名称：</span>
            <span class="value">{{ edgeData.factor.factor_name }}</span>
          </div>
          <div class="factor-item">
            <span class="label">因子类型：</span>
            <span class="value">{{ edgeData.factor.factor_type }}</span>
          </div>
          <div class="factor-item">
            <span class="label">作用效果：</span>
            <span class="value effect" :class="getEffectClass(edgeData.factor.effect)">
              {{ edgeData.factor.effect }}
            </span>
          </div>
          <div v-if="edgeData.factor.description" class="factor-description">
            <span class="label">详细描述：</span>
            <p class="description-text">{{ edgeData.factor.description }}</p>
          </div>
        </div>
      </div>

      <!-- 支撑文献 -->
      <div class="section">
        <div class="section-title">支撑文献</div>
        <div class="literature-info">
          <div class="literature-header">
            <h4 class="literature-title">{{ edgeData.literature.title }}</h4>
            <div class="literature-meta">
              <span class="publication-date">{{ formatDate(edgeData.literature.publication_date) }}</span>
              <span class="citation-count">引用: {{ edgeData.literature.citation_count }}</span>
            </div>
          </div>

          <div class="literature-details">
            <div class="detail-row">
              <span class="label">作者：</span>
              <span class="value"> {{ Array.isArray(edgeData.literature.authors)
                ? edgeData.literature.authors.join(', ')
                : edgeData.literature.authors || '未知' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">期刊：</span>
              <span class="value">{{ edgeData.literature.source }}</span>
            </div>
            <div v-if="edgeData.literature.doi" class="detail-row">
              <span class="label">DOI：</span>
              <span class="value doi">{{ edgeData.literature.doi }}</span>
            </div>
            <div v-if="edgeData.literature.pmid" class="detail-row">
              <span class="label">PMID：</span>
              <span class="value">{{ edgeData.literature.pmid }}</span>
            </div>
          </div>

          <div v-if="edgeData.literature.keywords?.length" class="keywords">
            <span class="label">关键词：</span>
            <div class="keyword-tags">
              <span v-for="keyword in edgeData.literature.keywords" :key="keyword" class="keyword-tag">
                {{ keyword }}
              </span>
            </div>
          </div>

          <div class="literature-actions">
            <a v-if="edgeData.literature.url" :href="edgeData.literature.url" target="_blank"
              class="view-literature-btn">
              查看原文
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 遮罩层 -->
  <div v-if="visible" class="card-overlay" @click="close"></div>
</template>

<script>
import { ref } from 'vue'
import { Close, Delete, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import KnowledgeGraph from '@/api/knowledgeGraph' // 根据你的实际路径调整

export default {
  name: 'EdgeInfoCard',
  components: { Close, Delete, Loading },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    edgeData: {
      type: Object,
      default: () => ({})
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    }
  },
  emits: ['close', 'deleted'],
  setup(props, { emit }) {
    const deleting = ref(false)

    const close = () => {
      emit('close')
    }

    const handleDelete = async () => {
      if (!props.edgeData.id) {
        ElMessage.error('关系ID不存在，无法删除')
        return
      }

      deleting.value = true

      try {
        await KnowledgeGraph.deleteRelation(props.edgeData.id)
        ElMessage.success('关系删除成功')
        // emit('deleted', props.edgeData.id)
        close()
      } catch (error) {
        console.error('删除关系失败:', error)
        ElMessage.error(error.response?.data?.message || '删除关系失败，请重试')
      } finally {
        deleting.value = false
      }
    }

    const getEffectClass = (effect) => {
      if (!effect) return ''
      const effectLower = effect.toLowerCase()
      if (effectLower.includes('促进') || effectLower.includes('增强') || effectLower.includes('激活')) {
        return 'positive'
      } else if (effectLower.includes('抑制') || effectLower.includes('减弱') || effectLower.includes('降低')) {
        return 'negative'
      }
      return 'neutral'
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN')
    }

    return {
      deleting,
      close,
      handleDelete,
      getEffectClass,
      formatDate
    }
  }
}
</script>

<style scoped>
.card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

.edge-info-card {
  position: fixed;
  width: 480px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #e1e5e9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  color: #f56c6c;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover:not(:disabled) {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.delete-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.card-content {
  padding: 0;
  max-height: 520px;
  overflow-y: auto;
}

.section {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f4;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 关系流程显示 */
.relation-flow {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.entity-box {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: #fafbfc;
}

.entity-box.source {
  border-color: #4ECDC4;
  background: rgba(78, 205, 196, 0.05);
}

.entity-box.target {
  border-color: #FF6B6B;
  background: rgba(255, 107, 107, 0.05);
}

.entity-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  font-size: 14px;
}

.entity-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.level-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 500;
  color: white;
}

.level-badge.level-1 {
  background: #FF6B6B;
}

.level-badge.level-2 {
  background: #4ECDC4;
}

.level-badge.level-3 {
  background: #45B7D1;
}

.entity-type {
  font-size: 11px;
  color: #666;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
}

.entity-subtype {
  font-size: 11px;
  color: #888;
  font-style: italic;
}

.arrow-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.factor-info {
  text-align: center;
}

.factor-name {
  font-weight: 600;
  color: #333;
  font-size: 12px;
}

.factor-type {
  font-size: 11px;
  color: #666;
}

.arrow {
  font-size: 20px;
  color: #666;
  font-weight: bold;
}

/* 因子详情 */
.factor-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.factor-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.factor-description {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
}

.label {
  font-weight: 500;
  color: #666;
  font-size: 13px;
  min-width: 70px;
  flex-shrink: 0;
}

.value {
  color: #333;
  font-size: 13px;
}

.value.effect {
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 12px;
}

.effect.positive {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.effect.negative {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.effect.neutral {
  background: rgba(158, 158, 158, 0.1);
  color: #9E9E9E;
}

.description-text {
  margin: 0;
  line-height: 1.5;
  color: #555;
  font-size: 13px;
}

/* 文献信息 */
.literature-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.literature-header {
  border-bottom: 1px solid #f1f3f4;
  padding-bottom: 8px;
}

.literature-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.literature-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.citation-count {
  color: #4CAF50;
  font-weight: 500;
}

.literature-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
}

.detail-row .label {
  min-width: 50px;
  flex-shrink: 0;
}

.doi {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 11px;
  background: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
}

.keywords {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.keyword-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.literature-actions {
  padding-top: 8px;
  border-top: 1px solid #f1f3f4;
}

.view-literature-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: #1976d2;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.view-literature-btn:hover {
  background: #1565c0;
  text-decoration: none;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .edge-info-card {
    width: 90vw;
    max-width: 400px;
    left: 5vw !important;
    top: 10vh !important;
  }

  .relation-flow {
    flex-direction: column;
    align-items: stretch;
  }

  .arrow-container {
    order: 2;
    flex-direction: row;
    justify-content: center;
  }

  .arrow {
    transform: rotate(90deg);
  }
}
</style>