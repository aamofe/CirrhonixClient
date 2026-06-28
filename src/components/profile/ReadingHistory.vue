<template>
  <div class="reading-history-component">
    <h3>阅读历史</h3>
    <div v-if="!loading && allReadingHistory.length" class="reading-history">
      <LiteratureCard v-for="item in readingHistory" :key="item.id" :article="formatArticleData(item)"
        @view-detail="handleViewDetail" />
      <Pagination :currentPage="currentPage" :totalPages="totalPages" @page-change="handlePageChange" />
    </div>
    <LoadingSpinner v-else-if="loading" />
    <EmptyState v-else message="您还没有阅读记录" />
  </div>
</template>

<script>
import LiteratureCard from "@/components/literature/LiteratureCard.vue"
import Pagination from "@/components/navigation/Pagination.vue"
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue"
import EmptyState from "@/components/ui/EmptyState.vue"
import Literature from "@/api/Literature"

export default {
  name: "ReadingHistoryComponent",
  components: {
    LiteratureCard,
    Pagination,
    LoadingSpinner,
    EmptyState,
  },
  data() {
    return {
      loading: true,
      allReadingHistory: [],
      currentPage: 1,
      pageSize: 10,
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.allReadingHistory.length / this.pageSize)
    },
    readingHistory() {
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
      return {
        id: item.literature_id,
        title: item.literature_title,
        authors: [],
        source: '',
        publication_date: item.read_date,
        publication_type: '',
        keywords: [],
        citation_count: undefined,
        language: 'zh',
        doi: '',
        url: '',
        abstract: item.personal_notes || ''
      }
    },
    handleViewDetail(literatureId) {
      this.$router.push(`/literature/${literatureId}`)
    },
    handlePageChange(page) {
      this.currentPage = page
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
</style>
