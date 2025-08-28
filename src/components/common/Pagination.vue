<template>
    <div class="pagination">
        <span class="page-btn" :class="{ disabled: currentPage === 1 }" @click="changePage(currentPage - 1)">
            上一页
          </span>

        <template v-for="page in displayedPages" :key="page">
            <span v-if="page === '...'" class="page-ellipsis"> ... </span>
            <span v-else class="page-number" :class="{ active: page === currentPage }" @click="changePage(page)">
                {{ page }}
              </span>
          </template>

        <span class="page-btn" :class="{ disabled: currentPage === totalPages }" @click="changePage(currentPage + 1)">
            下一页
          </span>
      </div>
</template>

<script>
export default {
  name: "Pagination",
  props: {
    currentPage: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
    delta: {
      type: Number,
      default: 2,
    },
  },
  emits: ['page-change'],
  computed: {
    displayedPages() {
      const total = this.totalPages
      const current = this.currentPage
      const delta = this.delta // delta=2，表示当前页前后各显示2个页码

      const range = []
      for (let i = current - delta; i <= current + delta; i++) {
        if (i > 0 && i <= total) {
          range.push(i)
        }
      }

      // 检查是否需要左侧省略号
      const withLeftEllipsis = range[0] > 1 + delta
      if (withLeftEllipsis) {
        range.unshift('...')
        range.unshift(1)
      }

      // 检查是否需要右侧省略号
      const withRightEllipsis = range[range.length - 1] < total - delta
      if (withRightEllipsis) {
        range.push('...')
        // 避免重复添加total页码
        if (range[range.length - 2] !== total) {
          range.push(total)
        }
      }

      // 处理总页数较少的情况
      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
      }

      // 如果没有省略号，但首尾不完整，确保首尾页显示
      if (!withLeftEllipsis && range[0] !== 1) {
        range.unshift(1)
      }
      if (!withRightEllipsis && range[range.length - 1] !== total) {
        if (range[range.length - 1] !== total) {
          range.push(total)
        }
      }

      return range
    },
  },
  methods: {
    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      this.$emit('page-change', page)
    },
  },
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
}

.page-btn,
.page-number {
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  min-width: 40px;
  text-align: center;
  border-radius: 0;
}

.page-btn:first-of-type,
.page-number:first-of-type {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.page-btn:last-of-type,
.page-number:last-of-type {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.page-number+.page-number,
.page-btn+.page-number,
.page-number+.page-btn,
.page-ellipsis+.page-btn {
  margin-left: -1px;
}

.page-btn:hover:not(.disabled),
.page-number:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
  z-index: 1;
}

.page-number.active {
  background-color: #a8e6cf;
  border-color: #a8e6cf;
  color: white;
  z-index: 2;
}

.page-btn.disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #dee2e6;
}

.page-ellipsis {
  padding: 0.5rem 0.25rem;
  color: #6c757d;
  font-size: 14px;
  border: none;
  background: transparent;
}
</style>