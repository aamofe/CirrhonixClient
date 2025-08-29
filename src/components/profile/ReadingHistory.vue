<template>
  <div class="reading-history-component">
    <h3>阅读历史</h3>
    <div v-if="!loading && allReadingHistory.length" class="reading-history">
      <LiteratureItem v-for="item in readingHistory" :key="item.id" :article="formatArticleData(item)"
        @view-detail="handleViewDetail" />
      <Pagination :currentPage="currentPage" :totalPages="totalPages" @page-change="handlePageChange" />
    </div>
    <div v-else-if="loading" class="loading">加载中...</div>
    <div v-else class="empty-state">您还没有阅读记录</div>
  </div>
</template>

<script>
import LiteratureItem from "@/components/layout/LiteratureItem.vue"
import Pagination from "@/components/common/Pagination.vue"
import Literature from "@/api/Literature"

export default {
  name: "ReadingHistoryComponent",
  components: {
    LiteratureItem,
    Pagination,
  },
  data() {
    return {
      loading: true,
      allReadingHistory: [], // 存储所有阅读历史
      currentPage: 1,
      pageSize: 10, // 每页显示的文献数量
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.allReadingHistory.length / this.pageSize)
    },
    readingHistory() {
      // 客户端分页
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.allReadingHistory.slice(start, end)
    }
  },
  methods: {
    async fetchReadingHistory() {
      this.loading = true
      try {
        const response = await Literature.getInteractions()

        this.allReadingHistory = response.data.data

      } catch (error) {
        console.error('获取阅读历史失败:', error)
        this.$message.error("获取阅读历史失败")
      } finally {
        this.loading = false
      }
    },
    formatArticleData(item) {
      // 将阅读历史记录格式化为 LiteratureItem 所需的 article 格式
      // 基于实际API返回的字段结构
      return {
        id: item.literature_id,
        title: item.literature_title,
        authors: [], // API未返回作者信息
        source: '', // API未返回来源信息
        publication_date: item.read_date, // 使用阅读日期作为显示日期
        publication_type: '', // API未返回出版类型
        keywords: [], // API未返回关键词
        citation_count: undefined, // API未返回引用次数
        language: 'zh', // 默认中文
        doi: '', // API未返回DOI
        url: '', // API未返回URL
        abstract: item.personal_notes || '' // 使用个人笔记作为摘要显示
      }
    },
    handleViewDetail(literatureId) {
      this.$router.push(`/literature/${literatureId}`)
    },
    handlePageChange(page) {
      this.currentPage = page
      // 客户端分页不需要重新请求数据
    }
  },
  created() {
    this.fetchReadingHistory()
  },
}
</script>

<style scoped>
.reading-history-component {
  width: 100%;
}

.reading-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #777;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>