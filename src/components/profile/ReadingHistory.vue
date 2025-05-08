<!-- src/components/profile/ReadingHistoryComponent.vue -->
<template>
  <div class="reading-history-component">
    <h3>阅读历史</h3>
    <div v-if="!loading && readingHistory.length" class="reading-history">
      <LiteratureCard
        v-for="item in readingHistory"
        :key="item.id"
        :literature="item.literature"
        :compact="true"
        :showReadDate="true"
        :readDate="item.read_date"
      />
    </div>
    <div v-else-if="loading" class="loading">加载中...</div>
    <div v-else class="empty-state">您还没有阅读记录</div>
  </div>
</template>

<script>
import LiteratureCard from "@/components/cards/LiteratureCard.vue";
import Literature from "@/api/Literature";

export default {
  name: "ReadingHistoryComponent",
  components: {
    LiteratureCard,
  },
  data() {
    return {
      loading: true,
      readingHistory: [],
    };
  },
  methods: {
    async fetchReadingHistory() {
      this.loading = true;
      try {
        const response = await Literature.getInteractions({
          is_read: true,
          sort: "-updated_at",
        });
        this.readingHistory = response.data.items || [];
      } catch (error) {
        console.error("获取阅读历史失败", error);
        this.$message.error("获取阅读历史失败");
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  created() {
    this.fetchReadingHistory();
  },
};
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
