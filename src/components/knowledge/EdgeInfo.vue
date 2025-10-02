<template>
  <div v-if="visible">
    <div class="card-overlay" @click="close"></div>

    <div class="edge-info-card" :style="{ left: position.x + 'px', top: position.y + 'px' }" @click.stop
      @wheel.stop="handleWheel" @touchmove.stop="handleTouchMove">
      <div class="card-header">
        <h3 class="card-title">
          {{ mode === 'view' ? `关系详情 (${edgeData.factors?.length || 0} 条)` : mode === 'edit' ? '编辑关系' : '创建关系' }}
        </h3>
        <div class="header-actions">
          <button v-if="mode === 'view'" @click="mode = 'create'" class="action-btn create-btn">
            <el-icon>
              <Plus />
            </el-icon>
          </button>
          <button @click="close" class="close-btn">
            <el-icon>
              <Close />
            </el-icon>
          </button>
        </div>
      </div>

      <div class="card-content">
        <!-- 查看模式 -->
        <div v-if="mode === 'view'">
          <div class="section">
            <div class="section-title">实体信息</div>
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
              </div>
              <div class="arrow-container">
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
              </div>
            </div>
          </div>

          <div v-if="edgeData.factors && edgeData.factors.length > 0" class="section">
            <div class="section-title">详细关系列表</div>
            <div class="factors-list">
              <div v-for="(factor, index) in edgeData.factors" :key="factor.id" class="factor-item">
                <div class="factor-index">{{ index + 1 }}.</div>
                <div class="factor-details">
                  <div class="detail-row">
                    <span class="label">因子：</span>
                    <span class="value">{{ factor.factor_name || '无' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">类型：</span>
                    <span class="value">{{ factor.factor_type || '无' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">效果：</span>
                    <span class="value effect" :class="getEffectClass(factor.effect)">
                      {{ factor.effect || '无' }}
                    </span>
                  </div>
                  <div v-if="factor.description" class="detail-row">
                    <span class="label">描述：</span>
                    <span class="value">{{ factor.description }}</span>
                  </div>
                  <div v-if="factor.literature" class="detail-row literature-row">
                    <span class="label">文献：</span>
                    <button @click.stop="viewArticleDetail(factor.literature)" class="literature-link" type="button">
                      {{ factor.literature.title || '无标题' }}
                    </button>
                  </div>
                  <div class="action-buttons">
                    <button class="edit-btn" @click="startEdit(factor)">
                      <el-icon>
                        <Edit />
                      </el-icon>
                    </button>
                    <el-popconfirm title="确定要删除这条关系吗？" confirm-button-text="确定" cancel-button-text="取消"
                      @confirm="handleDelete(factor.id)" popper-class="edge-card-popconfirm" :teleported="false">
                      <template #reference>
                        <button class="delete-btn" @click.stop>
                          <el-icon>
                            <Delete />
                          </el-icon>
                        </button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="section">
            <p class="empty-message">暂无关系详情。</p>
          </div>
        </div>

        <!-- 编辑/创建模式 -->
        <div v-else class="edit-form">
          <div class="section">
            <div class="section-title">实体信息</div>
            <div class="relation-flow">
              <div class="entity-box source">
                <div class="entity-name">{{ edgeData.source_entity.name }}</div>
                <div class="entity-meta">
                  <span class="level-badge" :class="`level-${edgeData.source_entity.level}`">
                    Level {{ edgeData.source_entity.level }}
                  </span>
                </div>
              </div>
              <div class="arrow-container">
                <div class="arrow">→</div>
              </div>
              <div class="entity-box target">
                <div class="entity-name">{{ edgeData.target_entity.name }}</div>
                <div class="entity-meta">
                  <span class="level-badge" :class="`level-${edgeData.target_entity.level}`">
                    Level {{ edgeData.target_entity.level }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">关系信息</div>
            <el-form :model="formData" label-width="90px" label-position="left">
              <el-form-item label="因子名称" required>
                <el-input v-model="formData.factor_name" placeholder="请输入因子名称" />
              </el-form-item>
              <el-form-item label="因子类型">
                <el-input v-model="formData.factor_type" placeholder="请输入因子类型" />
              </el-form-item>
              <el-form-item label="因子缩写">
                <el-input v-model="formData.factor_abbreviation" placeholder="请输入因子缩写" />
              </el-form-item>
              <el-form-item label="效果" required>
                <el-input v-model="formData.effect" placeholder="例如：促进、抑制" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入关系描述" />
              </el-form-item>
              <el-form-item label="文献名称">
                <el-input v-model="formData.literature_name" placeholder="请输入支持文献名称" />
              </el-form-item>
            </el-form>
          </div>

          <div class="form-actions">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitting"
              :disabled="!formData.factor_name || !formData.effect">
              {{ mode === 'edit' ? '保存' : '创建' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElPopconfirm } from 'element-plus'
import { Close, Delete, Edit, Plus } from '@element-plus/icons-vue'
import KnowledgeGraph from '@/api/knowledgeGraph'
import bus from '@/utils/bus'
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  edgeData: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'deleted'])

const router = useRouter()
const store = useStore()
const isAdmin = computed(() => store.getters.isAdmin)

const mode = ref('view') // 'view' | 'edit' | 'create'
const submitting = ref(false)
const formData = ref({
  relation_id: null,
  source_id: null,
  target_id: null,
  factor_name: '',
  factor_type: '',
  factor_abbreviation: '',
  effect: '',
  description: '',
  literature_name: '',
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    mode.value = 'view'
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = '15px'
  } else {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''

    const cardContent = document.querySelector('.edge-info-card .card-content')
    if (cardContent) {
      delete cardContent._startY
      delete cardContent._startScrollTop
    }
  }
})

const handleWheel = (event) => {
  const cardContent = event.currentTarget.querySelector('.card-content')
  const { scrollTop, scrollHeight, clientHeight } = cardContent

  const scrollingUp = event.deltaY < 0
  const scrollingDown = event.deltaY > 0

  const atTop = scrollTop <= 0
  const atBottom = scrollTop >= scrollHeight - clientHeight

  if ((scrollingUp && atTop) || (scrollingDown && atBottom)) {
    event.preventDefault()
  } else {
    cardContent.scrollTop += event.deltaY
    event.preventDefault()
  }
}

const handleTouchMove = (event) => {
  const cardContent = event.currentTarget.querySelector('.card-content')
  const { scrollTop, scrollHeight, clientHeight } = cardContent

  const touch = event.touches[0]
  if (!cardContent._startY) {
    cardContent._startY = touch.clientY
    cardContent._startScrollTop = scrollTop
    return
  }

  const deltaY = cardContent._startY - touch.clientY
  const newScrollTop = cardContent._startScrollTop + deltaY

  const atTop = newScrollTop <= 0
  const atBottom = newScrollTop >= scrollHeight - clientHeight

  if (!atTop && !atBottom) {
    cardContent.scrollTop = newScrollTop
    event.preventDefault()
  } else if ((atTop && deltaY < 0) || (atBottom && deltaY > 0)) {
    event.preventDefault()
  }
}

const close = () => {
  mode.value = 'view'
  emit('close')
}

const startEdit = (factor) => {
  formData.value = {
    relation_id: factor.id,
    source_id: props.edgeData.source_entity.id,
    target_id: props.edgeData.target_entity.id,
    factor_name: factor.factor_name || '',
    factor_type: factor.factor_type || '',
    factor_abbreviation: factor.factor_abbreviation || '',
    effect: factor.effect || '',
    description: factor.description || '',
    literature_name: factor.literature?.name || '',
  }
  mode.value = 'edit'
}

const cancelEdit = () => {
  mode.value = 'view'
  resetForm()
}

const resetForm = () => {
  formData.value = {
    relation_id: null,
    source_id: null,
    target_id: null,
    factor_name: '',
    factor_type: '',
    factor_abbreviation: '',
    effect: '',
    description: '',
    literature_name: '',
  }
}

const submitForm = async () => {
  if (!formData.value.factor_name || !formData.value.effect) {
    ElMessage.warning('请填写必填项')
    return
  }

  submitting.value = true
  try {
    if (mode.value === 'create') {
      const createData = {
        source_id: props.edgeData.source_entity.id,
        target_id: props.edgeData.target_entity.id,
        factor_name: formData.value.factor_name,
        factor_type: formData.value.factor_type,
        factor_abbreviation: formData.value.factor_abbreviation,
        effect: formData.value.effect,
        description: formData.value.description,
        literature_name: formData.value.literature_name,
      }
      const res = await KnowledgeGraph.createRelation(createData)
      
      if (isAdmin.value) {
        ElMessage.success('关系创建成功')
      } else {
        ElMessage.success('创建申请已提交，等待管理员审核')
      }
    } else {
      const updateData = {
        relation_id: formData.value.relation_id,
        source_id: formData.value.source_id,
        target_id: formData.value.target_id,
        factor_name: formData.value.factor_name,
        factor_type: formData.value.factor_type,
        factor_abbreviation: formData.value.factor_abbreviation,
        effect: formData.value.effect,
        description: formData.value.description,
        literature_name: formData.value.literature_name,
      }
      const res = await KnowledgeGraph.updateRelation(updateData)
      
      if (isAdmin.value) {
        ElMessage.success('关系更新成功')
      } else {
        ElMessage.success('修改申请已提交，等待管理员审核')
      }
    }

    mode.value = 'view'
    resetForm()
    bus.emit('graph-updated')
    emit('deleted')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (factorId) => {
  if (!factorId) {
    ElMessage.error('关系ID不存在，无法删除')
    return
  }

  try {
    const res = await KnowledgeGraph.deleteRelation(factorId)
    
    if (isAdmin.value) {
      ElMessage.success('关系删除成功')
    } else {
      ElMessage.success('删除申请已提交，等待管理员审核')
    }
    
    emit('deleted', factorId)
    close()
    bus.emit('graph-updated')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '删除关系失败，请重试')
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

const viewArticleDetail = (article) => {
  if (article && article.id) {
    close()
    setTimeout(() => {
      router.push({ name: "literature-detail", params: { id: article.id } })
    }, 100)
  } else {
    ElMessage.warning('文献ID不存在，无法跳转')
  }
}
</script>

<style scoped>
.edge-info-card {
  z-index: 2000;
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1999;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  color: #1a91c1;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #e0f2fe;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.card-content {
  padding: 0;
  max-height: calc(80vh - 72px);
  overflow-y: auto;
  scroll-behavior: smooth;
}

.section {
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  font-size: 14px;
}

.relation-flow {
  display: flex;
  align-items: center;
  gap: 12px;
}

.entity-box {
  flex: 1;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.entity-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.entity-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.level-badge {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.level-1 {
  background: #fef3c7;
  color: #92400e;
}

.level-2 {
  background: #dbeafe;
  color: #1e40af;
}

.level-3 {
  background: #d1fae5;
  color: #065f46;
}

.entity-type {
  font-size: 12px;
  color: #6b7280;
}

.arrow-container {
  display: flex;
  align-items: center;
}

.arrow {
  font-size: 18px;
  color: #6b7280;
}

.factors-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.factor-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  position: relative;
}

.factor-index {
  font-weight: 600;
  color: #6b7280;
  min-width: 24px;
}

.factor-details {
  flex: 1;
  position: relative;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
  align-items: flex-start;
  gap: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #374151;
  min-width: 50px;
  font-size: 14px;
}

.value {
  color: #1f2937;
  font-size: 14px;
  line-height: 1.4;
  flex: 1;
}

.effect.positive {
  color: #059669;
  font-weight: 500;
}

.effect.negative {
  color: #dc2626;
  font-weight: 500;
}

.effect.neutral {
  color: #6b7280;
}

.literature-link {
  background: none;
  border: none;
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  text-align: left;
  line-height: 1.4;
}

.literature-link:hover {
  color: #1d4ed8;
  text-decoration: none;
}

.action-buttons {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  z-index: 10;
}

.edit-btn,
.delete-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  color: #1a91c1;
}

.edit-btn:hover {
  background: #e0f2fe;
  border-color: #bae6fd;
  transform: scale(1.05);
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
  transform: scale(1.05);
}

.empty-message {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  margin: 0;
}

.edit-form {
  padding: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 自定义滚动条 */
.card-content::-webkit-scrollbar {
  width: 6px;
}

.card-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.card-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.card-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

<!-- 全局样式 - 解决弹窗层级问题 -->
<style>
.edge-card-popconfirm {
  z-index: 3000 !important;
}

.el-popper.is-pure {
  z-index: 3000 !important;
}

.el-popconfirm__main {
  z-index: 3001 !important;
}
</style>