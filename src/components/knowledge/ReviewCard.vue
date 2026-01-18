<template>
  <el-drawer
    v-model="drawerVisible"
    :title="isAdmin ? '审核管理' : '我的审核记录'"
    :size="600"
    direction="rtl"
    :before-close="handleClose"
  >
    <div class="review-card">
      <!-- 管理员视图 -->
      <div v-if="isAdmin" class="admin-view">
        <!-- 工具栏 -->
        <div class="toolbar">
          <el-button
            type="primary"
            :loading="isApprovingAll"
            @click="handleApproveAll"
            :disabled="pendingReviews.length === 0"
          >
            <el-icon><Check /></el-icon>
            一键批准全部
          </el-button>
          <el-button @click="loadPendingReviews" :loading="isLoading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>

        <!-- 待审核列表 -->
        <div v-if="pendingReviews.length === 0 && !isLoading" class="empty-state">
          <el-empty description="暂无待审核记录" />
        </div>

        <div v-else class="reviews-list">
          <div
            v-for="review in pendingReviews"
            :key="review.id"
            class="review-item"
          >
            <div class="review-header">
              <div class="review-meta">
                <el-tag :type="getOperationTypeTagType(review.operation_type)" size="small">
                  {{ getOperationTypeDisplay(review.operation_type) }}
                </el-tag>
                <span class="review-submitter">提交人: {{ review.submitted_by?.username || '-' }}</span>
                <span class="review-time">{{ formatDate(review.submitted_at) }}</span>
              </div>
            </div>

            <div class="review-content">
              <div class="review-relation">
                <span class="relation-label">关系:</span>
                <span>{{ getRelationTypeDisplay(review.modified_data?.relation_type) }}</span>
              </div>

              <div v-if="review.modified_data?.description" class="review-description">
                <span class="description-label">描述:</span>
                <span>{{ review.modified_data.description }}</span>
              </div>

              <div v-if="review.original_data" class="review-comparison">
                <div class="comparison-item">
                  <span class="comparison-label">源实体:</span>
                  <span>{{ review.original_data.source_entity?.canonical_name || '-' }}</span>
                </div>
                <div class="comparison-item">
                  <span class="comparison-label">目标实体:</span>
                  <span>{{ review.original_data.target_entity?.canonical_name || '-' }}</span>
                </div>
              </div>
            </div>

            <div class="review-actions">
              <el-button
                type="success"
                size="small"
                @click="handleReview(review.id, 'approve')"
                :loading="review.id === reviewingId"
              >
                批准
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleReview(review.id, 'reject')"
                :loading="review.id === reviewingId"
              >
                拒绝
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 普通用户视图 -->
      <div v-else class="user-view">
        <div v-if="myReviews.length === 0 && !isLoading" class="empty-state">
          <el-empty description="暂无审核记录" />
        </div>

        <div v-else class="reviews-list">
          <div
            v-for="review in myReviews"
            :key="review.id"
            class="review-item"
            :class="getReviewStatusClass(review.status)"
          >
            <div class="review-header">
              <div class="review-meta">
                <el-tag :type="getStatusTagType(review.status)" size="small">
                  {{ getStatusDisplay(review.status) }}
                </el-tag>
                <el-tag :type="getOperationTypeTagType(review.operation_type)" size="small">
                  {{ getOperationTypeDisplay(review.operation_type) }}
                </el-tag>
                <span class="review-time">{{ formatDate(review.submitted_at) }}</span>
              </div>
            </div>

            <div class="review-content">
              <div class="review-relation">
                <span class="relation-label">关系:</span>
                <span>{{ getRelationTypeDisplay(review.modified_data?.relation_type) }}</span>
              </div>

              <div v-if="review.modified_data?.description" class="review-description">
                <span class="description-label">描述:</span>
                <span>{{ review.modified_data.description }}</span>
              </div>

              <div v-if="review.review_message" class="review-message">
                <span class="message-label">审核留言:</span>
                <span>{{ review.review_message }}</span>
              </div>

              <div v-if="review.reviewed_at" class="review-meta-info">
                <span>审核时间: {{ formatDate(review.reviewed_at) }}</span>
                <span v-if="review.reviewed_by">审核人: {{ review.reviewed_by?.username }}</span>
              </div>
            </div>

            <div class="review-actions">
              <el-button
                v-if="review.status === 'pending'"
                type="warning"
                size="small"
                @click="handleWithdraw(review.id)"
                :loading="review.id === withdrawingId"
              >
                撤回
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 拒绝审核对话框 -->
      <el-dialog
        v-model="showRejectDialog"
        title="拒绝审核"
        width="400px"
      >
        <el-input
          v-model="rejectMessage"
          type="textarea"
          :rows="4"
          placeholder="请填写拒绝原因（必填）"
        />
        <template #footer>
          <el-button @click="showRejectDialog = false">取消</el-button>
          <el-button type="danger" @click="confirmReject" :loading="isReviewing">
            确认拒绝
          </el-button>
        </template>
      </el-dialog>
    </div>
  </el-drawer>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'
import KnowledgeGraph from '@/api/knowledgeGraph'

export default {
  name: 'ReviewCard',
  components: {
    Check,
    Refresh,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const drawerVisible = computed({
      get: () => props.visible,
      set: () => {
        // 关闭由 before-close 处理
      },
    })

    const isLoading = ref(false)
    const isApprovingAll = ref(false)
    const isReviewing = ref(false)
    const reviewingId = ref(null)
    const withdrawingId = ref(null)

    const pendingReviews = ref([])
    const myReviews = ref([])

    const showRejectDialog = ref(false)
    const rejectMessage = ref('')
    const currentRejectId = ref(null)

    // 加载待审核列表（管理员）
    const loadPendingReviews = async () => {
      if (!props.isAdmin) return

      isLoading.value = true
      try {
        const response = await KnowledgeGraph.getPendingReviews()
        if (response.data && response.data.data) {
          pendingReviews.value = response.data.data.reviews || []
        }
      } catch (error) {
        console.error('加载待审核列表失败:', error)
        ElMessage.error('加载待审核列表失败')
      } finally {
        isLoading.value = false
      }
    }

    // 加载我的审核记录（普通用户）
    const loadMyReviews = async () => {
      if (props.isAdmin) return

      isLoading.value = true
      try {
        const response = await KnowledgeGraph.getMyReviews()
        if (response.data && response.data.data) {
          myReviews.value = response.data.data.reviews || []
        }
      } catch (error) {
        console.error('加载我的审核记录失败:', error)
        ElMessage.error('加载审核记录失败')
      } finally {
        isLoading.value = false
      }
    }

    // 审核操作
    const handleReview = async (reviewId, action) => {
      if (action === 'reject') {
        currentRejectId.value = reviewId
        showRejectDialog.value = true
        return
      }

      // 批准操作
      reviewingId.value = reviewId
      try {
        await KnowledgeGraph.reviewRelation({
          review_id: reviewId,
          action: 'approve',
          review_message: '',
        })
        ElMessage.success('审核通过')
        loadPendingReviews()
        emit('updated')
      } catch (error) {
        console.error('审核失败:', error)
        ElMessage.error(error.response?.data?.message || '审核失败')
      } finally {
        reviewingId.value = null
      }
    }

    // 确认拒绝
    const confirmReject = async () => {
      if (!rejectMessage.value.trim()) {
        ElMessage.warning('请填写拒绝原因')
        return
      }

      isReviewing.value = true
      try {
        await KnowledgeGraph.reviewRelation({
          review_id: currentRejectId.value,
          action: 'reject',
          review_message: rejectMessage.value,
        })
        ElMessage.success('已拒绝')
        showRejectDialog.value = false
        rejectMessage.value = ''
        currentRejectId.value = null
        loadPendingReviews()
        emit('updated')
      } catch (error) {
        console.error('拒绝失败:', error)
        ElMessage.error(error.response?.data?.message || '拒绝失败')
      } finally {
        isReviewing.value = false
      }
    }

    // 一键批准全部
    const handleApproveAll = async () => {
      try {
        await ElMessageBox.confirm('确定要批准所有待审核记录吗？', '确认操作', {
          type: 'warning',
        })

        isApprovingAll.value = true
        await KnowledgeGraph.approveAllReviews()
        ElMessage.success('批量批准成功')
        loadPendingReviews()
        emit('updated')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量批准失败:', error)
          ElMessage.error(error.response?.data?.message || '批量批准失败')
        }
      } finally {
        isApprovingAll.value = false
      }
    }

    // 撤回审核
    const handleWithdraw = async (reviewId) => {
      try {
        await ElMessageBox.confirm('确定要撤回这条审核记录吗？', '确认操作', {
          type: 'warning',
        })

        withdrawingId.value = reviewId
        await KnowledgeGraph.withdrawReview(reviewId)
        ElMessage.success('撤回成功')
        loadMyReviews()
        emit('updated')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('撤回失败:', error)
          ElMessage.error(error.response?.data?.message || '撤回失败')
        }
      } finally {
        withdrawingId.value = null
      }
    }

    const handleClose = () => {
      emit('close')
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN')
      } catch (e) {
        return dateString
      }
    }

    // 操作类型显示
    const getOperationTypeDisplay = (type) => {
      const types = {
        'create': '创建',
        'update': '修改',
        'delete': '删除',
      }
      return types[type] || type
    }

    const getOperationTypeTagType = (type) => {
      const tagTypes = {
        'create': 'success',
        'update': 'warning',
        'delete': 'danger',
      }
      return tagTypes[type] || ''
    }

    // 状态显示
    const getStatusDisplay = (status) => {
      const statuses = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝',
        'withdrawn': '已撤回',
      }
      return statuses[status] || status
    }

    const getStatusTagType = (status) => {
      const tagTypes = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger',
        'withdrawn': 'info',
      }
      return tagTypes[status] || ''
    }

    const getReviewStatusClass = (status) => {
      return `status-${status}`
    }

    // 关系类型显示
    const getRelationTypeDisplay = (type) => {
      const types = {
        'POSITIVE_CORRELATION': '正相关',
        'NEGATIVE_CORRELATION': '负相关',
        'ASSOCIATION': '关联',
        'INTERACTION': '交互',
      }
      return types[type] || type || '-'
    }

    watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          if (props.isAdmin) {
            loadPendingReviews()
          } else {
            loadMyReviews()
          }
        }
      },
      { immediate: true }
    )

    watch(
      () => props.isAdmin,
      () => {
        if (props.visible) {
          if (props.isAdmin) {
            loadPendingReviews()
          } else {
            loadMyReviews()
          }
        }
      }
    )

    return {
      drawerVisible,
      isLoading,
      isApprovingAll,
      isReviewing,
      reviewingId,
      withdrawingId,
      pendingReviews,
      myReviews,
      showRejectDialog,
      rejectMessage,
      handleClose,
      loadPendingReviews,
      handleReview,
      confirmReject,
      handleApproveAll,
      handleWithdraw,
      formatDate,
      getOperationTypeDisplay,
      getOperationTypeTagType,
      getStatusDisplay,
      getStatusTagType,
      getReviewStatusClass,
      getRelationTypeDisplay,
    }
  },
}
</script>

<style scoped>
.review-card {
  padding: 8px 0;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.empty-state {
  padding: 40px 0;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 3px solid #1a91c1;
  transition: all 0.3s;
}

.review-item:hover {
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.review-header {
  margin-bottom: 12px;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.review-submitter {
  font-size: 13px;
  color: #666;
}

.review-time {
  font-size: 12px;
  color: #999;
}

.review-content {
  margin-bottom: 12px;
}

.review-relation,
.review-description,
.review-comparison {
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.relation-label,
.description-label {
  color: #666;
  margin-right: 8px;
}

.review-comparison {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comparison-item {
  display: flex;
  gap: 8px;
}

.comparison-label {
  color: #666;
  min-width: 80px;
}

.review-message {
  padding: 8px 12px;
  background: #fff3cd;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 8px;
}

.message-label {
  color: #856404;
  font-weight: 500;
  margin-right: 8px;
}

.review-meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.review-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.status-pending {
  border-left-color: #e6a23c;
}

.status-approved {
  border-left-color: #67c23a;
}

.status-rejected {
  border-left-color: #f56c6c;
}

.status-withdrawn {
  border-left-color: #909399;
}
</style>
