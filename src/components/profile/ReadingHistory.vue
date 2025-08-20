<!-- src/components/profile/ReadingHistoryComponent.vue -->
<template>
  <div class="reading-history-component">
    <h3>阅读历史</h3>
    <div v-if="!loading && readingHistory.length" class="reading-history">
      <LiteratureCard v-for="item in readingHistory" :key="item.id" :literature_id="item.literature_id"
        :literature_title="item.literature_title" :readDate="item.read_date" />
    </div>
    <div v-else-if="loading" class="loading">加载中...</div>
    <div v-else class="empty-state">您还没有阅读记录</div>
  </div>
</template>

<script>
import LiteratureCard from "@/components/cards/LiteratureCard.vue"
import Literature from "@/api/Literature"

export default {
  name: "ReadingHistoryComponent",
  components: {
    LiteratureCard,
  },
  data() {
    return {
      loading: true,
      readingHistory: [],
    }
  },
  methods: {
    async fetchReadingHistory() {
      this.loading = true
      try {
        const response = await Literature.getInteractions()

        this.readingHistory = response.data.data


      } catch (error) {

        this.$message.error("获取阅读历史失败")
      } finally {
        this.loading = false
      }
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