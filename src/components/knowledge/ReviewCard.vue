<template>
  <div v-if="visible">
    <div class="card-overlay" @click="close"></div>
    <div class="review-card" @click.stop>
      <div class="card-header">
        <h3 class="card-title">修改记录</h3>
        <button @click="close" class="close-btn">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      
      <!-- 管理员：显示标签页 -->
      <div class="card-tabs" v-if="isAdmin">
        <button :class="['tab-btn', { active: activeTab === 'pending' }]" @click="activeTab = 'pending'">
          待审核修改 ({{ pendingReviews.length }})
        </button>
        <button :class="['tab-btn', { active: activeTab === 'history' }]" @click="activeTab = 'history'">
          历史变更 ({{ historyRecords.length }})
        </button>
      </div>
      
      <div class="card-content">
        <!-- 普通用户：只显示我的修改（审批记录） -->
        <div v-if="!isAdmin" class="reviews-section">
          <div v-if="myReviews.length === 0" class="empty-state">
            <el-icon class="empty-icon"><Document /></el-icon>
            <p>暂无修改记录</p>
          </div>
          <div v-else class="reviews-list">
            <div v-for="review in myReviews" :key="review.id" class="review-item">
              <div class="review-header">
                <span :class="['status-badge', `status-${review.status}`]">
                  {{ review.status_display }}
                </span>
                <span class="review-date">{{ formatDate(review.submitted_at) }}</span>
              </div>
              <div class="review-content">
                <div class="info-line">
                  <span><b>类型</b> {{ review.operation_type_display }}</span>
                  <span><b>源</b> {{ review.modified_data?.source_entity?.name || review.original_data?.source_entity?.name || '-' }}</span>
                  <span><b>目标</b> {{ review.modified_data?.target_entity?.name || review.original_data?.target_entity?.name || '-' }}</span>
                </div>
                
                <!-- 更新操作 -->
                <div v-if="review.operation_type === 'update'" class="compare-table">
                  <div class="table-section before">
                    <div class="section-title">变更前</div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ review.original_data?.factor_name || '-' }}</span>
                      <span>{{ review.original_data?.factor_type || '-' }}</span>
                      <span>{{ review.original_data?.factor_abbreviation || '-' }}</span>
                      <span>{{ review.original_data?.effect || '-' }}</span>
                      <span>{{ review.original_data?.literature?.name || review.original_data?.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="review.original_data?.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ review.original_data.description }}</span>
                    </div>
                  </div>
                  <div class="table-section after">
                    <div class="section-title">变更后</div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ review.modified_data?.factor_name || '-' }}</span>
                      <span>{{ review.modified_data?.factor_type || '-' }}</span>
                      <span>{{ review.modified_data?.factor_abbreviation || '-' }}</span>
                      <span>{{ review.modified_data?.effect || '-' }}</span>
                      <span>{{ review.modified_data?.literature?.name || review.modified_data?.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="review.modified_data?.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ review.modified_data.description }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 新增操作 -->
                <div v-else-if="review.operation_type === 'create'" class="compare-table">
                  <div class="table-section create">
                    <div class="section-title">新增内容</div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ review.modified_data?.factor_name || '-' }}</span>
                      <span>{{ review.modified_data?.factor_type || '-' }}</span>
                      <span>{{ review.modified_data?.factor_abbreviation || '-' }}</span>
                      <span>{{ review.modified_data?.effect || '-' }}</span>
                      <span>{{ review.modified_data?.literature?.name || review.modified_data?.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="review.modified_data?.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ review.modified_data.description }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 删除操作 -->
                <div v-else class="compare-table">
                  <div class="table-section delete">
                    <div class="section-title">删除内容</div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ review.original_data?.factor_name || '-' }}</span>
                      <span>{{ review.original_data?.factor_type || '-' }}</span>
                      <span>{{ review.original_data?.factor_abbreviation || '-' }}</span>
                      <span>{{ review.original_data?.effect || '-' }}</span>
                      <span>{{ review.original_data?.literature?.name || review.original_data?.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="review.original_data?.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ review.original_data.description }}</span>
                    </div>
                  </div>
                </div>
                
                <div v-if="review.review_message" class="review-message">
                  <b>审核意见：</b>{{ review.review_message }}
                </div>
                <div v-if="review.status === 'pending'" class="review-actions">
                  <el-button v-if="review.operation_type !== 'delete'" size="small" @click="handleEditReview(review)">
                    <el-icon><Edit /></el-icon>修改
                  </el-button>
                  <el-button size="small" type="danger" plain @click="handleWithdrawReview(review.id)">
                    <el-icon><Close /></el-icon>撤回
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 管理员：待审核修改标签页 -->
        <div v-if="isAdmin && activeTab === 'pending'" class="reviews-section">
          <div class="pending-header">
            <el-button v-if="pendingReviews.length > 0" type="primary" @click="handleApproveAll" :loading="approving">
              <el-icon><Check /></el-icon>一键通过全部
            </el-button>
          </div>
          <div v-if="pendingReviews.length === 0" class="empty-state">
            <el-icon class="empty-icon"><CircleCheck /></el-icon>
            <p>暂无待审核修改</p>
          </div>
          <div v-else class="reviews-list">
            <div v-for="review in pendingReviews" :key="review.id" class="review-item">
              <div class="review-header">
                <span class="submitter">提交人：{{ review.submitted_by?.username || '未知' }}</span>
                <span class="review-date">{{ formatDate(review.submitted_at) }}</span>
              </div>
              <div class="review-content">
                <div class="info-line">
                  <span><b>类型</b> {{ review.operation_type_display }}</span>
                  <span><b>源</b> {{ review.modified_data?.source_entity?.name || review.original_data?.source_entity?.name || '-' }}</span>
                  <span><b>目标</b> {{ review.modified_data?.target_entity?.name || review.original_data?.target_entity?.name || '-' }}</span>
                </div>
                
                <!-- 更新操作 -->
                <div v-if="review.operation_type === 'update'" class="compare-table">
                  <div class="table-section before">
                    <div class="section-title">变更前</div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ review.original_data?.factor_name || '-' }}</span>
                      <span>{{ review.original_data?.factor_type || '-' }}</span>
                      <span>{{ review.original_data?.factor_abbreviation || '-' }}</span>
                      <span>{{ review.original_data?.effect || '-' }}</span>
                      <span>{{ review.original_data?.literature?.name || review.original_data?.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="review.original_data?.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ review.original_data.description }}</span>
                    </div>
                  </div>
                  <div class="table-section after">
                    <div class="section-title">变更后</div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ review.modified_data?.factor_name || '-' }}</span>
                      <span>{{ review.modified_data?.factor_type || '-' }}</span>
                      <span>{{ review.modified_data?.factor_abbreviation || '-' }}</span>
                      <span>{{ review.modified_data?.effect || '-' }}</span>
                      <span>{{ review.modified_data?.literature?.name || review.modified_data?.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="review.modified_data?.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ review.modified_data.description }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 新增操作 -->
                <div v-else-if="review.operation_type === 'create'" class="compare-table">
                  <div class="table-section create">
                    <div class="section-title">新增内容</div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ review.modified_data?.factor_name || '-' }}</span>
                      <span>{{ review.modified_data?.factor_type || '-' }}</span>
                      <span>{{ review.modified_data?.factor_abbreviation || '-' }}</span>
                      <span>{{ review.modified_data?.effect || '-' }}</span>
                      <span>{{ review.modified_data?.literature?.name || review.modified_data?.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="review.modified_data?.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ review.modified_data.description }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 删除操作 -->
                <div v-else class="compare-table">
                  <div class="table-section delete">
                    <div class="section-title">删除内容</div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ review.original_data?.factor_name || '-' }}</span>
                      <span>{{ review.original_data?.factor_type || '-' }}</span>
                      <span>{{ review.original_data?.factor_abbreviation || '-' }}</span>
                      <span>{{ review.original_data?.effect || '-' }}</span>
                      <span>{{ review.original_data?.literature?.name || review.original_data?.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="review.original_data?.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ review.original_data.description }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="review-actions">
                  <el-button size="small" type="success" @click="handleApprove(review.id)">
                    <el-icon><Check /></el-icon>通过
                  </el-button>
                  <el-button size="small" type="danger" plain @click="showRejectDialog(review.id)">
                    <el-icon><Close /></el-icon>拒绝
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 管理员：历史变更标签页 -->
        <div v-if="isAdmin && activeTab === 'history'" class="reviews-section">
          <div v-if="historyRecords.length === 0" class="empty-state">
            <el-icon class="empty-icon"><Clock /></el-icon>
            <p>暂无变更历史</p>
          </div>
          <div v-else class="reviews-list">
            <div v-for="history in historyRecords" :key="history.id" class="review-item">
              <div class="review-header">
                <div class="header-left">
                  <span :class="['operation-badge', `op-${history.operation_type}`]">
                    {{ history.operation_type_display }}
                  </span>
                  <span v-if="history.submitted_by " class="applicant">
                    申请人：{{ history.submitted_by.username }}
                  </span>
                  <span class="submitter">
                    审核者：{{ history.submitted_by && history.submitted_by.id === history.modified_by?.id ? '自动通过' : (history.modified_by?.username || '未知') }}
                  </span>
                  
                </div>
                <span class="review-date">{{ formatDate(history.modified_at) }}</span>
              </div>
              <div class="review-content">
                <div class="info-line">
                  <span><b>源</b> {{ history.source_entity?.name || '-' }}</span>
                  <span><b>目标</b> {{ history.target_entity?.name || '-' }}</span>
                </div>
                
                <div class="compare-table">
                  <div :class="['table-section', history.operation_type === 'create' ? 'create' : history.operation_type === 'delete' ? 'delete' : 'update']">
                    <div class="section-title">
                      {{ history.operation_type === 'create' ? '新增内容' : history.operation_type === 'delete' ? '删除内容' : '修改内容' }}
                    </div>
                    <div class="table-row labels">
                      <span>因子名称</span>
                      <span>因子类型</span>
                      <span>因子缩写</span>
                      <span>效果</span>
                      <span>文献</span>
                    </div>
                    <div class="table-row values">
                      <span>{{ history.factor_name || '-' }}</span>
                      <span>{{ history.factor_type || '-' }}</span>
                      <span>{{ history.factor_abbreviation || '-' }}</span>
                      <span>{{ history.effect || '-' }}</span>
                      <span>{{ history.literature?.name || history.literature?.title || '-' }}</span>
                    </div>
                    <div v-if="history.description" class="table-desc">
                      <span class="desc-label">描述</span>
                      <span class="desc-value">{{ history.description }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝修改" width="400px" :append-to-body="true">
      <el-form>
        <el-form-item label="拒绝原因" required>
          <el-input v-model="rejectMessage" type="textarea" :rows="4" placeholder="请输入拒绝原因..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :disabled="!rejectMessage.trim()">确定拒绝</el-button>
      </template>
    </el-dialog>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="修改提交内容" width="500px" :append-to-body="true">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="因子名称">
          <el-input v-model="editForm.factor_name" placeholder="请输入因子名称" />
        </el-form-item>
        <el-form-item label="因子类型">
          <el-input v-model="editForm.factor_type" placeholder="请输入因子类型" />
        </el-form-item>
        <el-form-item label="因子缩写">
          <el-input v-model="editForm.factor_abbreviation" placeholder="请输入因子缩写" />
        </el-form-item>
        <el-form-item label="效果">
          <el-input v-model="editForm.effect" placeholder="请输入效果" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="文献名称">
          <el-input v-model="editForm.literature_name" placeholder="请输入文献名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit" :loading="editing">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Document, CircleCheck, Check, Edit, Clock } from '@element-plus/icons-vue'
import KnowledgeGraph from '@/api/knowledgeGraph'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'updated'])

const store = useStore()
const isAdmin = computed(() => store.getters.isAdmin)

const activeTab = ref('pending')
const myReviews = ref([])
const historyRecords = ref([])
const pendingReviews = ref([])
const loading = ref(false)
const approving = ref(false)

const rejectDialogVisible = ref(false)
const rejectMessage = ref('')
const currentReviewId = ref(null)

const editDialogVisible = ref(false)
const editing = ref(false)
const editForm = ref({
  review_id: null,
  factor_name: '',
  factor_type: '',
  factor_abbreviation: '',
  effect: '',
  description: '',
  literature_name: '',
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (isAdmin.value) {
      loadPendingReviews()
      loadHistoryRecords()
    } else {
      loadMyReviews()
    }
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'pending' && isAdmin.value) {
    loadPendingReviews()
  } else if (newTab === 'history' && isAdmin.value) {
    loadHistoryRecords()
  }
})

const loadMyReviews = async () => {
  loading.value = true
  try {
    const res = await KnowledgeGraph.getMyReviews()
    const reviewsData = res.data.data
    myReviews.value = reviewsData?.reviews || []
  } catch (error) {
    console.error('加载我的记录失败:', error)
    ElMessage.error('加载我的记录失败')
  } finally {
    loading.value = false
  }
}

const loadHistoryRecords = async () => {
  loading.value = true
  try {
    const res = await KnowledgeGraph.getRelationHistory()
    const historyData = res.data.data
    historyRecords.value = historyData?.histories || []
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

const loadPendingReviews = async () => {
  loading.value = true
  try {
    const res = await KnowledgeGraph.getPendingReviews()
    const data = res.data.data
    pendingReviews.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('加载待审核记录失败:', error)
    ElMessage.error('加载待审核记录失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleWithdrawReview = async (reviewId) => {
  try {
    await ElMessageBox.confirm('确定要撤回这条审核记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await KnowledgeGraph.withdrawReview(reviewId)
    ElMessage.success('撤回成功')
    loadMyReviews()
    emit('updated')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '撤回失败')
    }
  }
}

const handleEditReview = (review) => {
  const modifiedData = review.modified_data || {}
  editForm.value = {
    review_id: review.id,
    factor_name: modifiedData.factor_name || '',
    factor_type: modifiedData.factor_type || '',
    factor_abbreviation: modifiedData.factor_abbreviation || '',
    effect: modifiedData.effect || '',
    description: modifiedData.description || '',
    literature_name: modifiedData.literature?.name || '',
  }
  editDialogVisible.value = true
}

const confirmEdit = async () => {
  editing.value = true
  try {
    await KnowledgeGraph.updateReview(editForm.value)
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    loadMyReviews()
    emit('updated')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '修改失败')
  } finally {
    editing.value = false
  }
}

const handleApprove = async (reviewId) => {
  try {
    await KnowledgeGraph.reviewRelation({
      review_id: reviewId,
      action: 'approve',
    })
    ElMessage.success('审核通过')
    loadPendingReviews()
    emit('updated')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '审核失败')
  }
}

const showRejectDialog = (reviewId) => {
  currentReviewId.value = reviewId
  rejectMessage.value = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  try {
    await KnowledgeGraph.reviewRelation({
      review_id: currentReviewId.value,
      action: 'reject',
      review_message: rejectMessage.value,
    })
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    loadPendingReviews()
    emit('updated')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleApproveAll = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要一键通过全部 ${pendingReviews.value.length} 条待审核记录吗？`,
      '批量审核',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    approving.value = true
    await KnowledgeGraph.approveAllReviews()
    ElMessage.success('已批量通过所有审核')
    loadPendingReviews()
    emit('updated')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '批量审核失败')
    }
  } finally {
    approving.value = false
  }
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.review-card {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  padding: 20px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}
.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  color: #6b7280;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}
.card-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}
.tab-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.tab-btn:hover {
  color: #1a91c1;
  background: #f9fafb;
}
.tab-btn.active {
  color: #1a91c1;
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #1a91c1;
}
.card-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}
.pending-header {
  margin-bottom: 12px;
  display: flex;
  justify-content: flex-end;
}
.empty-state {
  text-align: center;
  padding: 32px 20px;
  color: #9ca3af;
}
.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}
.empty-state p {
  margin: 0;
  font-size: 14px;
}
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.review-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.submitter, .applicant {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}
.status-badge, .operation-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-approved {
  background: #d1fae5;
  color: #065f46;
}
.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}
.status-withdrawn {
  background: #f3f4f6;
  color: #4b5563;
}
.op-create {
  background: #d1fae5;
  color: #065f46;
}
.op-update {
  background: #dbeafe;
  color: #1e40af;
}
.op-delete {
  background: #fee2e2;
  color: #991b1b;
}
.review-date {
  font-size: 12px;
  color: #9ca3af;
}
.review-content {
  padding: 12px;
}
.info-line {
  display: flex;
  gap: 12px;
  font-size: 13px;
  margin-bottom: 12px;
  color: #4b5563;
}
.info-line b {
  color: #6b7280;
  margin-right: 4px;
}
.compare-table {
  margin-bottom: 12px;
}
.table-section {
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}
.table-section:last-child {
  margin-bottom: 0;
}
.table-section.before {
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.table-section.after {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}
.table-section.create {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}
.table-section.delete {
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.table-section.update {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}
.section-title {
  font-weight: 600;
  font-size: 11px;
  margin-bottom: 8px;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.table-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.table-row.labels {
  margin-bottom: 4px;
}
.table-row.labels span {
  font-size: 10px;
  color: #6b7280;
  font-weight: 600;
}
.table-row.values span {
  font-size: 12px;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-desc {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.desc-label {
  font-size: 10px;
  color: #6b7280;
  font-weight: 600;
}
.desc-value {
  font-size: 11px;
  color: #4b5563;
  line-height: 1.5;
}
.review-message {
  margin-top: 12px;
  padding: 8px 10px;
  background: #fff7ed;
  border-left: 3px solid #fb923c;
  border-radius: 4px;
  font-size: 12px;
  color: #92400e;
}
.review-message b {
  margin-right: 4px;
}
.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}
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