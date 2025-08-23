<template>
  <div v-if="visible" class="node-info-card" :style="{ left: position.x + 'px', top: position.y + 'px' }" @click.stop>
    <div class="card-header">
      <h3 class="card-title">节点详情</h3>
      <div class="header-actions">
        <button @click="close" class="close-btn">
          <el-icon>
            <Close />
          </el-icon>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="card-content loading-content">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 主要内容 -->
    <div v-else class="card-content">
      <!-- 节点基本信息 -->
      <div class="section">
        <div class="section-title">基本信息</div>
        <div class="node-info-display">
          <div class="node-header">
            <div class="node-name-with-level">
              <span class="node-name">{{ nodeData.name }}</span>
              <span v-if="nodeData.level" class="level-badge-inline" :class="`level-${nodeData.level}`">
                Level {{ nodeData.level }}
              </span>
            </div>
            <div v-if="nodeData.chinese_name" class="chinese-name">{{ nodeData.chinese_name }}</div>
          </div>
          <div class="node-meta">
            <span v-if="nodeData.entity_type" class="entity-type">
              {{ nodeData.entity_type }}
            </span>
            <span v-if="nodeData.subtype" class="entity-subtype">
              {{ nodeData.subtype }}
            </span>
          </div>
          <div v-if="nodeData.abbreviation" class="node-abbreviation">
            <span class="label">缩写：</span>
            <span class="value">{{ nodeData.abbreviation }}</span>
          </div>
        </div>
      </div>

      <!-- API 错误提示 -->
      <div v-if="apiError" class="section">
        <div class="error-message">
          <h4>无法加载详细信息</h4>
          <p>{{ apiError }}</p>
          <button @click="loadNodeDetail" class="retry-btn">重试</button>
        </div>
      </div>

      <!-- 关系统计 -->
      <div v-else-if="detailData.relation_summary" class="section">
        <div class="section-title">关系统计</div>
        <div class="stats-display">
          <div class="stat-item primary">
            <span class="stat-value">{{ detailData.relation_summary.total_relations }}</span>
            <span class="stat-label">总关系数</span>
          </div>
          <div class="stat-item positive">
            <span class="stat-value">{{ detailData.relation_summary.as_source_count }}</span>
            <span class="stat-label">作为源</span>
          </div>
          <div class="stat-item negative">
            <span class="stat-value">{{ detailData.relation_summary.as_target_count }}</span>
            <span class="stat-label">作为目标</span>
          </div>
          <div class="stat-item neutral">
            <span class="stat-value">{{ detailData.relation_summary.unique_related_entities }}</span>
            <span class="stat-label">关联实体</span>
          </div>
        </div>
      </div>

      <!-- 基础信息展示（当无法获取详细信息时） -->
      <div v-else class="section">
        <div class="section-title">可用信息</div>
        <div class="basic-info">
          <div class="info-item">
            <span class="label">实体名称：</span>
            <span class="value">{{ nodeData.name }}</span>
          </div>
          <div v-if="nodeData.level" class="info-item">
            <span class="label">层级：</span>
            <span class="value">Level {{ nodeData.level }}</span>
          </div>
          <div v-if="nodeData.entity_type" class="info-item">
            <span class="label">类型：</span>
            <span class="value">{{ nodeData.entity_type }}</span>
          </div>
        </div>
      </div>

      <!-- 关系管理区域 -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">关系管理</div>
          <button @click="showAddRelationDialog = true" class="add-relation-btn">
            <el-icon>
              <Plus />
            </el-icon>
            新增关系
          </button>
        </div>
        <div class="relation-management">
          <p class="management-note">通过上方按钮可以为此节点添加新的关系连接。</p>
        </div>
      </div>
    </div>

    <!-- 新增关系对话框 -->
    <el-dialog v-model="showAddRelationDialog" title="新增关系" width="600px" :before-close="handleCloseAddDialog">
      <el-form :model="relationForm" :rules="relationRules" ref="relationFormRef" label-width="100px">
        <el-form-item label="关系方向" prop="direction">
          <el-radio-group v-model="relationForm.direction">
            <el-radio value="source">{{ nodeData.name }} → 目标实体</el-radio>
            <el-radio value="target">源实体 → {{ nodeData.name }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="relationForm.direction === 'source' ? '目标实体' : '源实体'" prop="targetEntity">
          <el-select v-model="relationForm.targetEntity" filterable remote reserve-keyword placeholder="请输入实体名称进行搜索"
            :remote-method="searchEntities" :loading="entityLoading" style="width: 100%" value-key="id" clearable
            :no-data-text="entityLoading ? '搜索中...' : '暂无数据'">
            <el-option v-for="entity in availableEntities" :key="entity.id || entity.name"
              :label="formatEntityLabel(entity)" :value="entity">
              <div class="entity-option">
                <div class="entity-name">{{ entity.name }}</div>
                <div class="entity-meta">
                  <span v-if="entity.chinese_name" class="chinese-name">{{ entity.chinese_name }}</span>
                  <span v-if="entity.entity_type" class="entity-type">{{ entity.entity_type }}</span>
                  <span v-if="entity.level" class="entity-level">Level {{ entity.level }}</span>
                </div>
              </div>
            </el-option>
          </el-select>
          <div class="search-tip">
            <span class="tip-text">💡 提示：输入实体名称、中文名或缩写进行搜索</span>
          </div>
        </el-form-item>

        <el-form-item label="作用效果" prop="effect">
          <el-input v-model="relationForm.effect" placeholder="请输入作用效果，如：增强、抑制、激活等" />
        </el-form-item>

        <el-form-item label="作用因子" prop="factorName">
          <el-input v-model="relationForm.factorName" placeholder="请输入作用因子名称（可选），如：CD52" />
        </el-form-item>

        <el-form-item label="因子类型" prop="factorType">
          <el-input v-model="relationForm.factorType" placeholder="请输入因子类型（可选），如：细胞因子" />
        </el-form-item>

        <el-form-item label="文献">
          <el-input v-model="relationForm.literature" placeholder="请输入相关文献信息（可选）" />
        </el-form-item>

        <el-form-item label="补充说明">
          <el-input v-model="relationForm.description" type="textarea" :rows="3" placeholder="请输入补充说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <button @click="handleCloseAddDialog" class="cancel-btn">取消</button>
          <button @click="handleAddRelation" :disabled="submitting" class="confirm-btn">
            <span v-if="submitting">提交中...</span>
            <span v-else>确定</span>
          </button>
        </span>
      </template>
    </el-dialog>
  </div>

  <!-- 遮罩层 -->
  <div v-if="visible" class="card-overlay" @click="close"></div>
</template>

<script>
import { ref, watch, reactive } from 'vue'
import { ElMessage, ElSkeleton, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElRadioGroup, ElRadio } from 'element-plus'
import { Close, Plus } from '@element-plus/icons-vue'
import KnowledgeGraph from '@/api/knowledgeGraph'

export default {
  name: 'NodeInfoCard',
  components: { Close, Plus, ElSkeleton, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElRadioGroup, ElRadio },
  props: {
    visible: { type: Boolean, default: false },
    nodeData: { type: Object, default: () => ({}) },
    position: { type: Object, default: () => ({ x: 0, y: 0 }) }
  },
  emits: ['close', 'relation-updated'],
  setup(props, { emit }) {
    const loading = ref(false)
    const detailData = ref({})
    const apiError = ref('')
    const showAddRelationDialog = ref(false)
    const entityLoading = ref(false)
    const availableEntities = ref([])
    const allEntities = ref([])
    const entitiesLoaded = ref(false)
    const submitting = ref(false)
    const relationFormRef = ref()

    const relationForm = reactive({
      direction: 'source',
      targetEntity: null,
      factorName: '',
      factorType: '',
      effect: '',
      literature: '',
      description: ''
    })

    const relationRules = {
      targetEntity: [
        { required: true, message: '请选择目标实体', trigger: 'change' }
      ],
      effect: [
        { required: true, message: '请输入作用效果', trigger: 'blur' }
      ]
    }


    const getEntityIdentifier = () => {
      return props.nodeData.id || props.nodeData.name || null
    }

    const close = () => {
      emit('close')
    }


    const formatEntityLabel = (entity) => {
      let label = entity.name || ''
      if (entity.chinese_name) {
        label += ` (${entity.chinese_name})`
      }
      if (entity.entity_type) {
        label += ` - ${entity.entity_type}`
      }
      return label
    }


    const loadAllEntities = async () => {
      if (entitiesLoaded.value) return

      entityLoading.value = true
      try {



        const response = await KnowledgeGraph.getEntities({
          limit: 500
        })



        if (response.data && response.data.message === 'success' && response.data.data) {
          const currentEntityId = getEntityIdentifier()


          const entities = response.data.data.entities || []


          allEntities.value = entities.filter(entity => {
            const entityId = entity.id || entity.name
            return entityId !== currentEntityId
          })

          entitiesLoaded.value = true

        } else {
          ElMessage.error('加载实体数据失败')
        }
      } catch (error) {
        ElMessage.error('加载实体数据失败，请重试')
      } finally {
        entityLoading.value = false
      }
    }
    const getRandomEntities = (count = 10) => {
      if (allEntities.value.length === 0) return []

      const shuffled = [...allEntities.value].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, Math.min(count, allEntities.value.length))
    }


    const filterEntitiesByQuery = (query) => {
      if (!query || query.trim() === '') return []

      const queryLower = query.trim().toLowerCase()
      return allEntities.value.filter(entity => {
        const name = (entity.name || '').toLowerCase()
        const chineseName = (entity.chinese_name || '').toLowerCase()
        const abbreviation = (entity.abbreviation || '').toLowerCase()
        const entityType = (entity.entity_type || '').toLowerCase()
        const subtype = (entity.subtype || '').toLowerCase()

        return name.includes(queryLower) ||
          chineseName.includes(queryLower) ||
          abbreviation.includes(queryLower) ||
          entityType.includes(queryLower) ||
          subtype.includes(queryLower)
      })
    }


    const searchEntities = async (query) => {



      if (!entitiesLoaded.value) {

        await loadAllEntities()
      }

      if (!query || query.trim() === '') {

        availableEntities.value = getRandomEntities(10)

      } else {

        const filtered = filterEntitiesByQuery(query)
        availableEntities.value = filtered.slice(0, 50)

      }
    }


    const loadNodeDetail = async () => {
      const entityIdentifier = getEntityIdentifier()






      if (!entityIdentifier) {

        apiError.value = '节点数据缺少有效的标识符（id 或 name）'
        return
      }

      loading.value = true
      apiError.value = ''

      try {
        const response = await KnowledgeGraph.getEntityDetail(entityIdentifier)

        if (response.data && response.data.message === 'success') {
          detailData.value = response.data.data
        } else {

          apiError.value = response.data?.message || 'API 返回未知错误'
        }
      } catch (error) {
        apiError.value = `请求失败: ${error.message}`
      } finally {
        loading.value = false
      }
    }


    const handleAddRelation = async () => {
      if (!relationFormRef.value) return

      try {
        await relationFormRef.value.validate()
      } catch {
        return
      }

      submitting.value = true
      try {
        const currentEntityId = getEntityIdentifier()
        const targetEntityId = relationForm.targetEntity.id || relationForm.targetEntity.name

        const relationData = {
          source_id: relationForm.direction === 'source'
            ? currentEntityId
            : targetEntityId,
          target_id: relationForm.direction === 'source'
            ? targetEntityId
            : currentEntityId,
          factor_name: relationForm.factorName || '',
          factor_type: relationForm.factorType || '',
          effect: relationForm.effect,
          literature: relationForm.literature || '',
          description: relationForm.description || ''
        }



        const response = await KnowledgeGraph.createRelation(relationData)


        if (response.data && (response.status === 200 || response.status === 201)) {
          ElMessage.success('关系创建成功')
          handleCloseAddDialog()
          loadNodeDetail()
          emit('relation-updated')
        } else {
          throw new Error(response.data?.message || '创建关系失败')
        }
      } catch (error) {

        const errorMessage = error.response?.data?.message || error.message || '创建关系失败，请重试'
        ElMessage.error(errorMessage)
      } finally {
        submitting.value = false
      }
    }


    const handleCloseAddDialog = () => {
      showAddRelationDialog.value = false
      Object.assign(relationForm, {
        direction: 'source',
        targetEntity: null,
        factorName: '',
        factorType: '',
        effect: '',
        literature: '',
        description: ''
      })
      availableEntities.value = []
      if (relationFormRef.value) {
        relationFormRef.value.resetFields()
      }
    }


    watch(showAddRelationDialog, async (isOpen) => {
      if (isOpen) {


        await loadAllEntities()

        searchEntities('')
      }
    })


    watch(() => [props.visible, props.nodeData], ([visible, nodeData]) => {
      if (visible && nodeData && getEntityIdentifier()) {
        loadNodeDetail()
      }
    }, { immediate: true, deep: true })

    return {
      loading,
      detailData,
      apiError,
      showAddRelationDialog,
      entityLoading,
      availableEntities,
      submitting,
      relationFormRef,
      relationForm,
      relationRules,
      getEntityIdentifier,
      close,
      formatEntityLabel,
      loadNodeDetail,
      searchEntities,
      handleAddRelation,
      handleCloseAddDialog
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
.node-info-card {
  position: fixed;
  z-index: 1000;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  font-family: 'Arial', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 12px 20px;
  background-color: #f7f9fc;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.card-title {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: #888;
}

.close-btn:hover {
  background-color: #f0f0f0;
}

.card-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
  background-color: #fff;
}

.loading-content {
  padding: 20px;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

/* 节点信息样式 */
.node-info-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-name-with-level {
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-name {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
}

.level-badge-inline {
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.level-1 {
  background-color: #ff6b6b;
}

.level-2 {
  background-color: #4ecdc4;
}

.level-3 {
  background-color: #45b7d1;
}

.chinese-name {
  font-size: 14px;
  color: #67C23A;
  font-style: italic;
}

.node-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.entity-type {
  background-color: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.entity-subtype {
  background-color: #e6f7ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #1890ff;
}

.node-abbreviation {
  font-size: 14px;
}

.node-abbreviation .label {
  font-weight: 600;
  color: #555;
}

.node-abbreviation .value {
  color: #666;
}

/* 统计数据样式 */
.stats-display {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  text-align: center;
}

.stat-item {
  background-color: #f7f9fc;
  padding: 15px 10px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.stat-item.primary {
  background-color: #e6f7ff;
  border-left: 4px solid #1890ff;
}

.stat-item.positive {
  background-color: #f6ffed;
  border-left: 4px solid #52c41a;
}

.stat-item.negative {
  background-color: #fff2e8;
  border-left: 4px solid #fa8c16;
}

.stat-item.neutral {
  background-color: #f0f0f0;
  border-left: 4px solid #d9d9d9;
}

/* 基础信息样式 */
.basic-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
}

.info-item .label {
  font-weight: 600;
  color: #555;
  min-width: 80px;
  flex-shrink: 0;
}

.info-item .value {
  color: #666;
  word-break: break-all;
}

/* 错误信息样式 */
.error-message {
  text-align: center;
  padding: 20px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}

.error-message h4 {
  color: #ff4d4f;
  margin: 0 0 8px 0;
}

.error-message p {
  color: #ff7875;
  margin: 0 0 12px 0;
}

.retry-btn {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #ff7875;
}

/* 关系管理样式 */
.relation-management {
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px dashed #d0d0d0;
}

.management-note {
  color: #666;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.add-relation-btn {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.add-relation-btn:hover {
  background-color: #337ecc;
}

/* 实体选择下拉框样式 */
.entity-option {
  padding: 4px 0;
}

.entity-option .entity-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.entity-option .entity-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 8px;
  align-items: center;
}

.entity-option .chinese-name {
  color: #67C23A;
}

.entity-option .entity-type {
  background-color: #f0f2f5;
  padding: 1px 6px;
  border-radius: 3px;
  color: #606266;
}

.entity-option .entity-level {
  background-color: #409EFF;
  color: white;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.search-tip {
  margin-top: 4px;
}

.search-tip .tip-text {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

/* Dialog footer styles */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #606266;
  border: 1px solid #dcdfe6;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #e6e8eb;
  border-color: #c0c4cc;
}

.confirm-btn {
  background-color: #409eff;
  color: white;
  border: 1px solid #409eff;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #337ecc;
  border-color: #337ecc;
}

.confirm-btn:disabled {
  background-color: #a0cfff;
  border-color: #a0cfff;
  cursor: not-allowed;
}

/* Card overlay for backdrop */
.card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.3);
}

/* Form styles within dialog */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  font-weight: 600;
  color: #606266;
}

.el-input__inner,
.el-textarea__inner {
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  transition: border-color 0.2s;
}

.el-input__inner:focus,
.el-textarea__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.el-radio {
  margin-right: 20px;
  margin-bottom: 8px;
}

.el-radio__label {
  font-size: 14px;
  color: #606266;
}

.el-select {
  width: 100%;
}

.el-select .el-input__inner {
  cursor: pointer;
}

.el-select-dropdown {
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* Responsive design */
@media (max-width: 768px) {
  .node-info-card {
    width: 95vw;
    max-height: 90vh;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%);
  }

  .stats-display {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-item {
    padding: 12px 8px;
  }

  .stat-value {
    font-size: 16px;
  }

  .card-content {
    padding: 15px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .add-relation-btn {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .node-name {
    font-size: 18px;
  }

  .stats-display {
    grid-template-columns: 1fr;
  }

  .node-name-with-level {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}

/* Animation for card appearance */
.node-info-card {
  animation: slideInFromRight 0.3s ease-out;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Loading skeleton customization */
.el-skeleton__item {
  background: linear-gradient(90deg, #f0f0f0 25%, rgba(240, 240, 240, 0.5) 50%, #f0f0f0 75%);
  background-size: 400% 100%;
  animation: loading 1.4s ease infinite;
}

@keyframes loading {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* Custom scrollbar */
.card-content::-webkit-scrollbar {
  width: 6px;
}

.card-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.card-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.card-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Hover effects for interactive elements */
.node-info-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

/* Focus styles for accessibility */
.close-btn:focus,
.add-relation-btn:focus,
.retry-btn:focus,
.cancel-btn:focus,
.confirm-btn:focus {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .node-info-card {
    border: 2px solid #000;
  }

  .card-header {
    border-bottom-color: #000;
  }

  .section-title {
    border-bottom-color: #000;
  }
}
</style>
