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

    <!-- 调试信息
    <div v-if="debugMode" class="debug-info" style="background: #f0f0f0; padding: 10px; margin: 10px; font-size: 12px;">
      <div>节点数据: {{ JSON.stringify(nodeData, null, 2) }}</div>
      <div>标识符: {{ getEntityIdentifier() }}</div>
      <div>加载状态: {{ loading }}</div>
    </div> -->

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

      <!-- 相关关系 - 仅在有详细数据时显示 -->
      <div v-if="detailData.relations" class="section">
        <div class="section-header">
          <div class="section-title">相关关系</div>
          <button @click="showAddRelationDialog = true" class="add-relation-btn">
            <el-icon>
              <Plus />
            </el-icon>
            新增关系
          </button>
        </div>

        <!-- 其余关系相关的代码保持不变... -->
        <!-- ... 省略了关系显示的完整代码，因为这部分没有问题 ... -->
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
            :remote-method="searchEntities" :loading="entityLoading" style="width: 100%" value-key="name">
            <el-option v-for="entity in availableEntities" :key="entity.name || entity.id" :label="`${entity.name} `"
              :value="entity" />
          </el-select>
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
import { ref, watch, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Plus, Delete, Loading } from '@element-plus/icons-vue'
import KnowledgeGraph from '@/api/knowledgeGraph'

export default {
  name: 'NodeInfoCard',
  components: { Close, Plus, Delete, Loading },
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
    const debugMode = ref(true) // 设置为 true 启用调试模式
    const showAddRelationDialog = ref(false)
    const entityLoading = ref(false)
    const availableEntities = ref([])
    const allEntities = ref([]) // 存储所有实体数据
    const entitiesLoaded = ref(false) // 标记是否已加载所有实体
    const submitting = ref(false)
    const deletingRelation = ref(false)
    const relationFormRef = ref()

    const relationForm = reactive({
      direction: 'source',
      targetEntity: null,
      factorName: '',
      factorType: '',
      effect: '', // 作用效果，必填
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
      // 移除factorName的必填验证，因为作用因子可以为空
    }

    // 获取实体标识符的方法
    const getEntityIdentifier = () => {
      return props.nodeData.id || props.nodeData.name || null
    }

    const close = () => {
      emit('close')
    }

    // 获取效果类样式
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

    // 加载所有实体数据（只调用一次）
    const loadAllEntities = async () => {
      if (entitiesLoaded.value) return

      entityLoading.value = true
      try {
        console.log('开始加载所有实体数据...')

        // 使用大的 page_size 来获取所有实体
        const response = await KnowledgeGraph.getEntities({
          page_size: 10000, // 设置一个足够大的数值来获取所有实体
          page: 1
        })

        console.log('API 响应:', response.data)

        if (response.data && response.data.message === 'success' && response.data.data) {
          const currentEntityId = getEntityIdentifier()

          // 根据后端返回的数据结构获取实体列表
          const entities = response.data.data.entities || response.data.data || []

          // 过滤掉当前节点
          allEntities.value = entities.filter(entity => {
            const entityId = entity.id || entity.name
            return entityId !== currentEntityId
          })

          entitiesLoaded.value = true
          console.log('所有实体加载成功，共:', allEntities.value.length, '个实体')
          console.log('实体样例:', allEntities.value.slice(0, 3))
        } else {
          console.error('加载实体失败，响应数据:', response.data)
          ElMessage.error('加载实体数据失败')
        }
      } catch (error) {
        console.error('加载所有实体失败:', error)
        ElMessage.error('加载实体数据失败，请重试')
      } finally {
        entityLoading.value = false
      }
    }

    // 随机获取指定数量的实体
    const getRandomEntities = (count = 10) => {
      if (allEntities.value.length === 0) return []

      const shuffled = [...allEntities.value].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, Math.min(count, allEntities.value.length))
    }

    // 根据搜索关键词过滤实体
    const filterEntitiesByQuery = (query) => {
      if (!query || query.trim() === '') return []

      const queryLower = query.trim().toLowerCase()
      return allEntities.value.filter(entity => {
        const name = (entity.name || '').toLowerCase()
        const chineseName = (entity.chinese_name || '').toLowerCase()
        const abbreviation = (entity.abbreviation || '').toLowerCase()
        const description = (entity.description || '').toLowerCase()

        return name.includes(queryLower) ||
          chineseName.includes(queryLower) ||
          abbreviation.includes(queryLower) ||
          description.includes(queryLower)
      })
    }

    // 搜索实体方法 - 现在只做前端过滤
    const searchEntities = (query) => {
      console.log('搜索关键词:', query)

      // 确保实体数据已加载
      if (!entitiesLoaded.value) {
        console.log('实体数据未加载，等待加载完成...')
        return
      }

      if (!query || query.trim() === '') {
        // 没有搜索关键词时，随机展示10个实体
        availableEntities.value = getRandomEntities(10)
        console.log('无搜索关键词，随机展示10个实体:', availableEntities.value.length)
      } else {
        // 有搜索关键词时，根据关键词过滤
        const filtered = filterEntitiesByQuery(query)
        availableEntities.value = filtered.slice(0, 50) // 限制显示前50个结果
        console.log(`搜索关键词"${query}"的结果:`, availableEntities.value.length, '个实体')
      }
    }

    // 加载节点详细信息
    const loadNodeDetail = async () => {
      const entityIdentifier = getEntityIdentifier()

      console.log('=== NodeInfoCard Debug ===')
      console.log('Props nodeData:', props.nodeData)
      console.log('Entity identifier:', entityIdentifier)
      console.log('Visible:', props.visible)

      if (!entityIdentifier) {
        console.error('节点数据缺少标识符')
        apiError.value = '节点数据缺少有效的标识符（id 或 name）'
        return
      }

      loading.value = true
      apiError.value = ''

      try {
        console.log('发送 API 请求，标识符:', entityIdentifier)
        const response = await KnowledgeGraph.getEntityDetail(entityIdentifier)
        console.log('API 响应:', response)

        if (response.data && response.data.message === 'success') {
          detailData.value = response.data.data
          console.log('节点详情加载成功:', detailData.value)
        } else {
          console.error('API 返回错误:', response.data)
          apiError.value = response.data?.message || 'API 返回未知错误'
        }
      } catch (error) {
        console.error('加载节点详情失败:', error)
        console.error('错误详情:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        apiError.value = `请求失败: ${error.message}`
      } finally {
        loading.value = false
      }
    }

    // 处理新增关系
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
          factor_name: relationForm.factorName,
          factor_type: relationForm.factorType,
          effect: relationForm.effect,
          literature_name: relationForm.literature || null, // 这是文献名称
          description: relationForm.description
        }

        console.log('创建关系数据:', relationData)

        const response = await KnowledgeGraph.createRelation(relationData)
        if (response.data && response.data.message === 'success') {
          ElMessage.success('关系创建成功')
          handleCloseAddDialog()
          loadNodeDetail()
          emit('relation-updated')
        }
      } catch (error) {
        console.error('创建关系失败:', error)
        ElMessage.error('创建关系失败')
      } finally {
        submitting.value = false
      }
    }

    // 删除关系
    const deleteRelation = async (relation) => {
      if (!relation.id) {
        ElMessage.error('关系ID不存在，无法删除')
        return
      }

      deletingRelation.value = true
      try {
        await KnowledgeGraph.deleteRelation(relation.id)
        ElMessage.success('关系删除成功')
        loadNodeDetail()
        emit('relation-updated')
      } catch (error) {
        console.error('删除关系失败:', error)
        ElMessage.error(error.response?.data?.message || '删除关系失败，请重试')
      } finally {
        deletingRelation.value = false
      }
    }

    // 关闭新增关系对话框
    const handleCloseAddDialog = () => {
      showAddRelationDialog.value = false
      Object.assign(relationForm, {
        direction: 'source',
        targetEntity: null,
        factorName: '',
        factorType: '',
        effect: '', // 重置作用效果
        literature: '',
        description: ''
      })
      availableEntities.value = []
      if (relationFormRef.value) {
        relationFormRef.value.resetFields()
      }
    }

    // 监听对话框打开状态
    watch(showAddRelationDialog, async (isOpen) => {
      if (isOpen) {
        console.log('新增关系对话框打开')
        // 对话框打开时，先确保加载所有实体数据
        await loadAllEntities()
        // 然后显示随机的10个实体
        searchEntities('')
      }
    })

    // 监听组件显示和节点数据变化
    watch(() => [props.visible, props.nodeData], ([visible, nodeData]) => {
      console.log('Watch triggered:', { visible, nodeData })
      if (visible && nodeData && getEntityIdentifier()) {
        loadNodeDetail()
      }
    }, { immediate: true, deep: true })

    return {
      loading,
      detailData,
      apiError,
      debugMode,
      showAddRelationDialog,
      entityLoading,
      availableEntities,
      submitting,
      deletingRelation,
      relationFormRef,
      relationForm,
      relationRules,
      getEntityIdentifier,
      close,
      getEffectClass,
      loadNodeDetail,
      searchEntities,
      handleAddRelation,
      deleteRelation,
      handleCloseAddDialog
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

.node-info-card {
  position: fixed;
  width: 520px;
  max-height: 80vh;
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
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
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

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
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

.card-content {
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.loading-content {
  padding: 20px;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* 节点信息显示 */
.node-info-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-header {
  margin-bottom: 8px;
}

/* 新增样式：将level显示在name旁边 */
.node-name-with-level {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.node-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.level-badge-inline {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.level-badge-inline.level-1 {
  background-color: #FF6B6B;
}

.level-badge-inline.level-2 {
  background-color: #4ECDC4;
}

.level-badge-inline.level-3 {
  background-color: #45B7D1;
}

.chinese-name {
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.node-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.level-badge {
  font-size: 11px;
  padding: 3px 8px;
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

.entity-type,
.entity-subtype {
  font-size: 11px;
  background: #e9ecef;
  padding: 3px 8px;
  border-radius: 4px;
  color: #666;
}

.node-abbreviation {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-top: 8px;
}

.node-abbreviation .label {
  font-weight: 500;
  color: #666;
}

.node-abbreviation .value {
  color: #333;
  font-weight: 500;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  color: #333;
}

/* 基础信息展示 */
.basic-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.info-item .label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.info-item .value {
  color: #333;
}

/* 错误信息 */
.error-message {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message h4 {
  margin: 0 0 8px 0;
  color: #e74c3c;
}

.error-message p {
  margin: 8px 0;
  font-size: 14px;
}

.retry-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #337ecc;
}

/* 统计显示 */
.stats-display {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 16px 8px;
  border-radius: 8px;
  border: 2px solid;
}

.stat-item.primary {
  background: rgba(64, 158, 255, 0.05);
  border-color: #409eff;
}

.stat-item.positive {
  background: rgba(76, 175, 80, 0.05);
  border-color: #4CAF50;
}

.stat-item.negative {
  background: rgba(255, 107, 107, 0.05);
  border-color: #FF6B6B;
}

.stat-item.neutral {
  background: rgba(158, 158, 158, 0.05);
  border-color: #9E9E9E;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 按钮样式 */
.add-relation-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-relation-btn:hover {
  background: #337ecc;
}

/* 关系组样式 */
.relation-group {
  margin-bottom: 20px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.relation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relation-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.relation-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.relation-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 关系流程显示 */
.relation-flow {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.entity-box {
  padding: 8px 12px;
  border-radius: 6px;
  border: 2px solid;
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
  font-size: 13px;
  color: #333;
}

.entity-meta {
  margin-top: 4px;
}

.arrow-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.factor-info {
  text-align: center;
}

.factor-name {
  font-weight: 600;
  color: #333;
  font-size: 12px;
}

.factor-effect {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.factor-effect.positive {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.factor-effect.negative {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.factor-effect.neutral {
  background: rgba(158, 158, 158, 0.1);
  color: #9E9E9E;
}

.arrow {
  font-size: 16px;
  color: #666;
  font-weight: bold;
}

.relation-description {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  margin-top: 4px;
}

.description-text {
  color: #555;
  line-height: 1.4;
}

.delete-relation-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  color: #f56c6c;
  transition: all 0.2s;
}

.delete-relation-btn:hover:not(:disabled) {
  background: rgba(245, 108, 108, 0.1);
}

.delete-relation-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 空状态 */
.empty-relations {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-message {
  font-size: 14px;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 12px;
  color: #999;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e9e9e9;
}

.confirm-btn {
  background: #409eff;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #337ecc;
}

.confirm-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .node-info-card {
    width: 90vw;
    max-width: 480px;
    left: 5vw !important;
    top: 10vh !important;
  }

  .stats-display {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .relation-flow {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .arrow-container {
    order: 2;
    flex-direction: row;
    justify-content: center;
  }

  .arrow {
    transform: rotate(90deg);
  }

  .node-name-with-level {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* 滚动条样式 */
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
</style>